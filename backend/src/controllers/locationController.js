const LocationTracking = require("../models/LocationTracking");
const Driver = require("../models/Driver");
const Ride = require("../models/Ride");
const { sendResponse, sendError } = require("../utils/response");
const { getIO } = require("../config/socket");

/**
 * Update user location
 */
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, heading, speed, accuracy } = req.body;
    const userId = req.user._id;

    // Create location tracking record
    const locationData = new LocationTracking({
      userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      heading,
      speed,
      accuracy,
    });

    await locationData.save();

    // If user is a driver, update driver location
    if (req.user.userType === "driver") {
      const driver = await Driver.findOne({ userId });
      if (driver) {
        driver.currentLocation = {
          type: "Point",
          coordinates: [longitude, latitude],
        };
        driver.lastLocationUpdate = new Date();
        await driver.save();

        // If driver is on a ride, update ride location tracking
        if (driver.currentRideId) {
          locationData.rideId = driver.currentRideId;
          await locationData.save();

          // Emit location to rider
          const io = getIO();
          const ride = await Ride.findById(driver.currentRideId);
          if (ride) {
            io.to(`user_${ride.riderId}`).emit("driver_location_update", {
              latitude,
              longitude,
              heading,
              speed,
              timestamp: new Date(),
            });
          }
        }
      }
    }

    sendResponse(res, 200, true, "Location updated successfully", {
      latitude,
      longitude,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Update location error:", error);
    sendError(res, 500, "Failed to update location", error.message);
  }
};

/**
 * Get nearby drivers
 */
const getNearbyDrivers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return sendError(res, 400, "Latitude and longitude are required");
    }

    const drivers = await Driver.find({
      isOnline: true,
      isAvailable: true,
      isVerified: true,
      currentLocation: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius) / 6378.1, // Convert km to radians
          ],
        },
      },
    })
      .populate("userId", "firstName lastName")
      .select(
        "userId currentLocation vehicleType vehicleModel vehicleColor rating"
      );

    const formattedDrivers = drivers.map((driver) => ({
      id: driver._id,
      name: `${driver.userId.firstName} ${driver.userId.lastName}`,
      location: {
        latitude: driver.currentLocation.coordinates[1],
        longitude: driver.currentLocation.coordinates[0],
      },
      vehicle: {
        type: driver.vehicleType,
        model: driver.vehicleModel,
        color: driver.vehicleColor,
      },
      rating: driver.rating,
    }));

    sendResponse(res, 200, true, "Nearby drivers retrieved successfully", {
      drivers: formattedDrivers,
      count: formattedDrivers.length,
    });
  } catch (error) {
    console.error("Get nearby drivers error:", error);
    sendError(res, 500, "Failed to retrieve nearby drivers", error.message);
  }
};

/**
 * Get ride location history
 */
const getRideLocationHistory = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user._id;

    // Check if user is authorized to view this ride's location history
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return sendError(res, 404, "Ride not found");
    }

    const isRider = ride.riderId.toString() === userId.toString();
    const isDriver =
      ride.driverId && ride.driverId.toString() === userId.toString();

    if (!isRider && !isDriver) {
      return sendError(
        res,
        403,
        "Not authorized to view this ride location history"
      );
    }

    const locationHistory = await LocationTracking.find({
      rideId,
      userId: ride.driverId, // Only driver locations during ride
    })
      .sort({ timestamp: 1 })
      .select("location heading speed timestamp");

    const formattedHistory = locationHistory.map((loc) => ({
      latitude: loc.location.coordinates[1],
      longitude: loc.location.coordinates[0],
      heading: loc.heading,
      speed: loc.speed,
      timestamp: loc.timestamp,
    }));

    sendResponse(res, 200, true, "Location history retrieved successfully", {
      rideId,
      locations: formattedHistory,
      count: formattedHistory.length,
    });
  } catch (error) {
    console.error("Get ride location history error:", error);
    sendError(res, 500, "Failed to retrieve location history", error.message);
  }
};

module.exports = {
  updateLocation,
  getNearbyDrivers,
  getRideLocationHistory,
};
