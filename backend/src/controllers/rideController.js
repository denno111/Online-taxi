const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const { sendResponse, sendError } = require("../utils/response");
const {
  calculateRidePrice,
  getCurrentSurgeLevel,
} = require("../services/pricingService");
const {
  findBestDriver,
  notifyDriver,
} = require("../services/rideMatchingService");
const { getIO } = require("../config/socket");

/**
 * Create a new ride request
 */
const createRideRequest = async (req, res) => {
  try {
    const {
      pickupLocation,
      destinationLocation,
      rideType = "standard",
      riderNotes,
    } = req.body;

    const riderId = req.user._id;

    // Check if user has any pending rides
    const existingRide = await Ride.findOne({
      riderId,
      status: { $in: ["pending", "accepted", "driver_arrived", "in_progress"] },
    });

    if (existingRide) {
      return sendError(res, 400, "You already have an active ride request");
    }

    // Get current surge level
    const surgeLevel = await getCurrentSurgeLevel({
      latitude: pickupLocation.coordinates[1],
      longitude: pickupLocation.coordinates[0],
    });

    // Calculate pricing
    const priceInfo = await calculateRidePrice(
      {
        latitude: pickupLocation.coordinates[1],
        longitude: pickupLocation.coordinates[0],
      },
      {
        latitude: destinationLocation.coordinates[1],
        longitude: destinationLocation.coordinates[0],
      },
      rideType,
      surgeLevel
    );

    // Create ride request
    const ride = new Ride({
      riderId,
      pickupLocation,
      destinationLocation,
      rideType,
      estimatedDistance: priceInfo.distance,
      estimatedDuration: priceInfo.duration,
      estimatedPrice: priceInfo.pricing.total,
      riderNotes,
    });

    await ride.save();

    // Populate rider info
    await ride.populate("riderId", "firstName lastName phone");

    // Find best driver
    const bestDriver = await findBestDriver(ride);

    if (bestDriver) {
      // Notify driver
      await notifyDriver(bestDriver, ride);

      // Set timer to find another driver if no response
      setTimeout(async () => {
        const updatedRide = await Ride.findById(ride._id);
        if (updatedRide.status === "pending") {
          // Find next best driver or cancel ride
          const nextDriver = await findBestDriver(updatedRide);
          if (nextDriver) {
            await notifyDriver(nextDriver, updatedRide);
          } else {
            // No drivers available
            updatedRide.status = "cancelled";
            updatedRide.cancelledAt = new Date();
            updatedRide.cancellationReason = "No drivers available";
            await updatedRide.save();

            const io = getIO();
            io.to(`user_${riderId}`).emit("ride_cancelled", {
              rideId: ride._id,
              reason: "No drivers available",
            });
          }
        }
      }, 30000); // 30 seconds timeout
    } else {
      return sendError(res, 400, "No drivers available in your area");
    }

    sendResponse(res, 201, true, "Ride request created successfully", {
      ride: ride.toObject(),
      pricing: priceInfo.pricing,
    });
  } catch (error) {
    console.error("Create ride request error:", error);
    sendError(res, 500, "Failed to create ride request", error.message);
  }
};

/**
 * Driver accepts ride request
 */
const acceptRideRequest = async (req, res) => {
  try {
    const { rideId } = req.params;
    const driverId = req.user._id;

    // Check if driver exists and is available
    const driver = await Driver.findOne({ userId: driverId });
    if (!driver) {
      return sendError(res, 404, "Driver profile not found");
    }

    if (!driver.isAvailable || driver.currentRideId) {
      return sendError(res, 400, "Driver is not available");
    }

    // Find and update ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return sendError(res, 404, "Ride not found");
    }

    if (ride.status !== "pending") {
      return sendError(res, 400, "Ride is no longer available");
    }

    // Update ride status
    ride.driverId = driverId;
    ride.status = "accepted";
    ride.acceptedAt = new Date();
    await ride.save();

    // Update driver status
    driver.isAvailable = false;
    driver.currentRideId = ride._id;
    await driver.save();

    // Populate ride with user details
    await ride.populate("riderId", "firstName lastName phone");
    await ride.populate("driverId", "firstName lastName phone");

    // Notify rider
    const io = getIO();
    io.to(`user_${ride.riderId._id}`).emit("ride_accepted", {
      rideId: ride._id,
      driver: {
        id: driverId,
        name: `${req.user.firstName} ${req.user.lastName}`,
        phone: req.user.phone,
        vehicle: {
          model: driver.vehicleModel,
          color: driver.vehicleColor,
          plate: driver.vehiclePlate,
        },
        rating: driver.rating,
        location: driver.currentLocation,
      },
    });

    sendResponse(res, 200, true, "Ride accepted successfully", ride);
  } catch (error) {
    console.error("Accept ride error:", error);
    sendError(res, 500, "Failed to accept ride", error.message);
  }
};

/**
 * Update ride status
 */
const updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return sendError(res, 404, "Ride not found");
    }

    // Check if user is authorized to update this ride
    const isRider = ride.riderId.toString() === userId.toString();
    const isDriver =
      ride.driverId && ride.driverId.toString() === userId.toString();

    if (!isRider && !isDriver) {
      return sendError(res, 403, "Not authorized to update this ride");
    }

    // Validate status transitions
    const validTransitions = {
      pending: ["cancelled"],
      accepted: ["driver_arrived", "cancelled"],
      driver_arrived: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[ride.status].includes(status)) {
      return sendError(
        res,
        400,
        `Invalid status transition from ${ride.status} to ${status}`
      );
    }

    // Update ride status
    ride.status = status;
    const timestamp = new Date();

    switch (status) {
      case "driver_arrived":
        ride.arrivedAt = timestamp;
        break;
      // ... (previous code continues)

      case "in_progress":
        ride.startedAt = timestamp;
        break;
      case "completed":
        ride.completedAt = timestamp;
        // Calculate actual price based on actual distance/time if available
        if (ride.actualDistance && ride.actualDuration) {
          const finalPrice = await calculateActualPrice(ride);
          ride.actualPrice = finalPrice;
        } else {
          ride.actualPrice = ride.estimatedPrice;
        }
        ride.paymentStatus = "paid"; // Assuming payment is processed

        // Update driver availability
        const driver = await Driver.findOne({ userId: ride.driverId });
        if (driver) {
          driver.isAvailable = true;
          driver.currentRideId = null;
          await driver.save();
        }
        break;
      case "cancelled":
        ride.cancelledAt = timestamp;
        ride.cancelledBy = userId;

        // Update driver availability if driver cancelled
        if (isDriver) {
          const driver = await Driver.findOne({ userId: ride.driverId });
          if (driver) {
            driver.isAvailable = true;
            driver.currentRideId = null;
            await driver.save();
          }
        }
        break;
    }

    await ride.save();

    // Populate ride with user details
    await ride.populate("riderId", "firstName lastName phone");
    if (ride.driverId) {
      await ride.populate("driverId", "firstName lastName phone");
    }

    // Notify relevant parties
    const io = getIO();
    const eventName = `ride_${status}`;

    if (isDriver) {
      io.to(`user_${ride.riderId._id}`).emit(eventName, {
        rideId: ride._id,
        status,
        timestamp,
        message: getStatusMessage(status, "rider"),
      });
    } else {
      io.to(`driver_${ride.driverId}`).emit(eventName, {
        rideId: ride._id,
        status,
        timestamp,
        message: getStatusMessage(status, "driver"),
      });
    }

    sendResponse(res, 200, true, "Ride status updated successfully", ride);
  } catch (error) {
    console.error("Update ride status error:", error);
    sendError(res, 500, "Failed to update ride status", error.message);
  }
};

/**
 * Get ride details
 */
const getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId)
      .populate("riderId", "firstName lastName phone")
      .populate("driverId", "firstName lastName phone");

    if (!ride) {
      return sendError(res, 404, "Ride not found");
    }

    // Check if user is authorized to view this ride
    const isRider = ride.riderId._id.toString() === userId.toString();
    const isDriver =
      ride.driverId && ride.driverId._id.toString() === userId.toString();

    if (!isRider && !isDriver) {
      return sendError(res, 403, "Not authorized to view this ride");
    }

    // If driver, include driver-specific info
    if (isDriver) {
      const driver = await Driver.findOne({ userId: ride.driverId });
      ride.driver = driver;
    }

    sendResponse(res, 200, true, "Ride details retrieved successfully", ride);
  } catch (error) {
    console.error("Get ride details error:", error);
    sendError(res, 500, "Failed to retrieve ride details", error.message);
  }
};

/**
 * Get user's ride history
 */
const getRideHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (req.user.userType === "rider") {
      query.riderId = userId;
    } else {
      query.driverId = userId;
    }

    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate("riderId", "firstName lastName phone")
      .populate("driverId", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ride.countDocuments(query);

    sendResponse(res, 200, true, "Ride history retrieved successfully", {
      rides,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get ride history error:", error);
    sendError(res, 500, "Failed to retrieve ride history", error.message);
  }
};

/**
 * Get active ride for user
 */
const getActiveRide = async (req, res) => {
  try {
    const userId = req.user._id;

    const query = {
      status: { $in: ["pending", "accepted", "driver_arrived", "in_progress"] },
    };

    if (req.user.userType === "rider") {
      query.riderId = userId;
    } else {
      query.driverId = userId;
    }

    const ride = await Ride.findOne(query)
      .populate("riderId", "firstName lastName phone")
      .populate("driverId", "firstName lastName phone");

    if (!ride) {
      return sendResponse(res, 200, true, "No active ride found", null);
    }

    // If driver, include driver-specific info
    if (req.user.userType === "driver") {
      const driver = await Driver.findOne({ userId: ride.driverId });
      ride.driver = driver;
    }

    sendResponse(res, 200, true, "Active ride retrieved successfully", ride);
  } catch (error) {
    console.error("Get active ride error:", error);
    sendError(res, 500, "Failed to retrieve active ride", error.message);
  }
};

/**
 * Cancel ride
 */
const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return sendError(res, 404, "Ride not found");
    }

    // Check if user is authorized to cancel this ride
    const isRider = ride.riderId.toString() === userId.toString();
    const isDriver =
      ride.driverId && ride.driverId.toString() === userId.toString();

    if (!isRider && !isDriver) {
      return sendError(res, 403, "Not authorized to cancel this ride");
    }

    // Check if ride can be cancelled
    if (["completed", "cancelled"].includes(ride.status)) {
      return sendError(res, 400, "Ride cannot be cancelled");
    }

    // Calculate cancellation fee if applicable
    let cancellationFee = 0;
    if (ride.status === "accepted" || ride.status === "driver_arrived") {
      cancellationFee = calculateCancellationFee(ride);
    }

    // Update ride
    ride.status = "cancelled";
    ride.cancelledAt = new Date();
    ride.cancelledBy = userId;
    ride.cancellationReason = reason;
    await ride.save();

    // Update driver availability if driver was assigned
    if (ride.driverId) {
      const driver = await Driver.findOne({ userId: ride.driverId });
      if (driver) {
        driver.isAvailable = true;
        driver.currentRideId = null;
        await driver.save();
      }
    }

    // Notify other party
    const io = getIO();
    if (isRider && ride.driverId) {
      io.to(`driver_${ride.driverId}`).emit("ride_cancelled", {
        rideId: ride._id,
        cancelledBy: "rider",
        reason,
        timestamp: new Date(),
      });
    } else if (isDriver) {
      io.to(`user_${ride.riderId}`).emit("ride_cancelled", {
        rideId: ride._id,
        cancelledBy: "driver",
        reason,
        timestamp: new Date(),
      });
    }

    sendResponse(res, 200, true, "Ride cancelled successfully", {
      ride,
      cancellationFee,
    });
  } catch (error) {
    console.error("Cancel ride error:", error);
    sendError(res, 500, "Failed to cancel ride", error.message);
  }
};

// Helper functions
const calculateActualPrice = async (ride) => {
  // Recalculate price based on actual distance and duration
  const config = require("../services/pricingService").PRICING_CONFIG[
    ride.rideType
  ];

  const baseFare = config.baseFare;
  const distanceFare = ride.actualDistance * config.perKilometer;
  const timeFare = ride.actualDuration * config.perMinute;

  const total = Math.max(
    baseFare + distanceFare + timeFare,
    config.minimumFare
  );
  return parseFloat(total.toFixed(2));
};

const calculateCancellationFee = (ride) => {
  // Simplified cancellation fee calculation
  const timeSinceAccepted = new Date() - ride.acceptedAt;
  const minutesSinceAccepted = timeSinceAccepted / (1000 * 60);

  if (minutesSinceAccepted > 5) {
    return 2.0; // $2 cancellation fee
  }

  return 0;
};

const getStatusMessage = (status, userType) => {
  const messages = {
    rider: {
      accepted: "Your ride has been accepted. Driver is on the way.",
      driver_arrived: "Your driver has arrived at the pickup location.",
      in_progress: "Your ride is now in progress.",
      completed: "Your ride has been completed. Thank you for riding with us!",
      cancelled: "Your ride has been cancelled.",
    },
    driver: {
      accepted: "You have accepted this ride request.",
      driver_arrived: "You have arrived at the pickup location.",
      in_progress: "Ride is now in progress.",
      completed: "Ride has been completed successfully.",
      cancelled: "This ride has been cancelled.",
    },
  };

  return messages[userType][status] || "Ride status updated.";
};

module.exports = {
  createRideRequest,
  acceptRideRequest,
  updateRideStatus,
  getRideDetails,
  getRideHistory,
  getActiveRide,
  cancelRide,
};
