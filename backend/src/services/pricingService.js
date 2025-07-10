const { calculateDistance, calculateDuration } = require("../utils/geospatial");

// Base pricing configuration
const PRICING_CONFIG = {
  standard: {
    baseFare: 3.0,
    perKilometer: 1.5,
    perMinute: 0.25,
    minimumFare: 5.0,
  },
  premium: {
    baseFare: 5.0,
    perKilometer: 2.0,
    perMinute: 0.35,
    minimumFare: 8.0,
  },
  economy: {
    baseFare: 2.0,
    perKilometer: 1.0,
    perMinute: 0.2,
    minimumFare: 4.0,
  },
};

// Surge pricing factors
const SURGE_FACTORS = {
  low: 1.0,
  medium: 1.5,
  high: 2.0,
  extreme: 3.0,
};

/**
 * Calculate ride price
 * @param {Object} pickup - {latitude, longitude}
 * @param {Object} destination - {latitude, longitude}
 * @param {string} rideType - 'standard', 'premium', or 'economy'
 * @param {string} surgeLevel - 'low', 'medium', 'high', or 'extreme'
 * @returns {Object} Pricing breakdown
 */
const calculateRidePrice = async (
  pickup,
  destination,
  rideType = "standard",
  surgeLevel = "low"
) => {
  const distance = calculateDistance(pickup, destination);
  const duration = calculateDuration(distance);

  const config = PRICING_CONFIG[rideType];
  const surgeFactor = SURGE_FACTORS[surgeLevel];

  // Calculate base price
  const baseFare = config.baseFare;
  const distanceFare = distance * config.perKilometer;
  const timeFare = duration * config.perMinute;

  const subtotal = baseFare + distanceFare + timeFare;
  const surgeAmount = (subtotal - baseFare) * (surgeFactor - 1);

  const total = Math.max(subtotal + surgeAmount, config.minimumFare);

  return {
    distance,
    duration,
    pricing: {
      baseFare: parseFloat(baseFare.toFixed(2)),
      distanceFare: parseFloat(distanceFare.toFixed(2)),
      timeFare: parseFloat(timeFare.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      surgeAmount: parseFloat(surgeAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      surgeFactor,
      surgeLevel,
    },
  };
};

/**
 * Get current surge level based on demand
 * @param {Object} location - {latitude, longitude}
 * @returns {string} Surge level
 */
const getCurrentSurgeLevel = async (location) => {
  // Simplified surge calculation
  // In production, this would consider:
  // - Current demand vs supply
  // - Historical data
  // - Special events
  // - Weather conditions

  const currentHour = new Date().getHours();
  const isRushHour =
    (currentHour >= 7 && currentHour <= 9) ||
    (currentHour >= 17 && currentHour <= 19);

  if (isRushHour) {
    return "medium";
  }

  return "low";
};

module.exports = {
  calculateRidePrice,
  getCurrentSurgeLevel,
  PRICING_CONFIG,
  SURGE_FACTORS,
};
