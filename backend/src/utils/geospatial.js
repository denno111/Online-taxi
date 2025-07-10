const geolib = require("geolib");

/**
 * Calculate distance between two points
 * @param {Object} point1 - {latitude, longitude}
 * @param {Object} point2 - {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (point1, point2) => {
  const distance = geolib.getDistance(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude }
  );
  return distance / 1000; // Convert to kilometers
};

/**
 * Calculate estimated duration based on distance
 * @param {number} distance - Distance in kilometers
 * @param {number} averageSpeed - Average speed in km/h (default: 30)
 * @returns {number} Duration in minutes
 */
const calculateDuration = (distance, averageSpeed = 30) => {
  return Math.round((distance / averageSpeed) * 60);
};

/**
 * Find nearby drivers within radius
 * @param {Object} location - {latitude, longitude}
 * @param {number} radius - Search radius in kilometers
 * @returns {Promise<Array>} Array of nearby drivers
 */
const findNearbyDrivers = async (location, radius = 5) => {
  const Driver = require("../models/Driver");

  const drivers = await Driver.find({
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    currentLocation: {
      $geoWithin: {
        $centerSphere: [
          [location.longitude, location.latitude],
          radius / 6378.1, // Convert km to radians
        ],
      },
    },
  }).populate("userId", "firstName lastName phone");

  return drivers;
};

/**
 * Get route information (simplified - in production use Google Maps API)
 * @param {Object} pickup - {latitude, longitude}
 * @param {Object} destination - {latitude, longitude}
 * @returns {Object} Route information
 */
const getRouteInfo = async (pickup, destination) => {
  // This is a simplified calculation
  // In production, use Google Maps Directions API or similar
  const distance = calculateDistance(pickup, destination);
  const duration = calculateDuration(distance);

  return {
    distance,
    duration,
    route: [], // Would contain actual route points from mapping API
  };
};

/**
 * Check if point is within bounds
 * @param {Object} point - {latitude, longitude}
 * @param {Object} bounds - {north, south, east, west}
 * @returns {boolean}
 */
const isWithinBounds = (point, bounds) => {
  return (
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  );
};

module.exports = {
  calculateDistance,
  calculateDuration,
  findNearbyDrivers,
  getRouteInfo,
  isWithinBounds,
};
