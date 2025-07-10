const { findNearbyDrivers, calculateDistance } = require("../utils/geospatial");
const Driver = require("../models/Driver");

/**
 * Find best driver for a ride request
 * @param {Object} rideRequest - Ride request details
 * @returns {Object|null} Best matched driver or null
 */
const findBestDriver = async (rideRequest) => {
  const { pickupLocation, rideType } = rideRequest;

  // Find nearby available drivers
  const nearbyDrivers = await findNearbyDrivers(
    {
      latitude: pickupLocation.coordinates[1],
      longitude: pickupLocation.coordinates[0],
    },
    10
  ); // 10km radius

  if (nearbyDrivers.length === 0) {
    return null;
  }

  // Score drivers based on multiple factors
  const scoredDrivers = nearbyDrivers.map((driver) => {
    const distance = calculateDistance(
      {
        latitude: pickupLocation.coordinates[1],
        longitude: pickupLocation.coordinates[0],
      },
      {
        latitude: driver.currentLocation.coordinates[1],
        longitude: driver.currentLocation.coordinates[0],
      }
    );

    // Scoring factors (weights can be adjusted)
    const distanceScore = Math.max(0, 100 - distance * 10); // Closer is better
    const ratingScore = driver.rating * 20; // Higher rating is better
    const acceptanceScore = driver.acceptanceRate; // Higher acceptance rate is better
    const responseScore = Math.max(0, 100 - driver.averageResponseTime / 2); // Faster response is better

    // Check if driver prefers this ride type
    const typePreference = driver.preferences.rideTypes.includes(rideType)
      ? 10
      : 0;

    const totalScore =
      distanceScore * 0.4 +
      ratingScore * 0.3 +
      acceptanceScore * 0.2 +
      responseScore * 0.1 +
      typePreference;

    return {
      driver,
      distance,
      score: totalScore,
    };
  });

  // Sort by score (highest first)
  scoredDrivers.sort((a, b) => b.score - a.score);

  return scoredDrivers[0].driver;
};

/**
 * Notify driver about ride request
 * @param {Object} driver - Driver to notify
 * @param {Object} rideRequest - Ride request details
 * @returns {Promise<boolean>} Success status
 */
const notifyDriver = async (driver, rideRequest) => {
  const io = require("../config/socket");

  // Send real-time notification
  io.to(`driver_${driver.userId._id}`).emit("ride_request", {
    rideId: rideRequest._id,
    pickup: rideRequest.pickupLocation,
    destination: rideRequest.destinationLocation,
    estimatedPrice: rideRequest.estimatedPrice,
    rideType: rideRequest.rideType,
    riderName: `${rideRequest.riderId.firstName} ${rideRequest.riderId.lastName}`,
    expiresAt: new Date(Date.now() + 30000), // 30 seconds to respond
  });

  return true;
};

module.exports = {
  findBestDriver,
  notifyDriver,
};
