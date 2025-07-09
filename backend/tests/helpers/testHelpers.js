const jwt = require("jsonwebtoken");
const User = require("../../src/models/User");
const Driver = require("../../src/models/Driver");
const Ride = require("../../src/models/Ride");

// Create test user
const createTestUser = async (userType = "rider", additionalData = {}) => {
  const userData = {
    firstName: "Test",
    lastName: "User",
    email: `test${Date.now()}@example.com`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    password: "password123",
    userType,
    isEmailVerified: true,
    isPhoneVerified: true,
    ...additionalData,
  };

  const user = new User(userData);
  await user.save();
  return user;
};

// Create test driver
const createTestDriver = async (userId, additionalData = {}) => {
  const driverData = {
    userId,
    licenseNumber: `DL${Date.now()}`,
    vehicleType: "sedan",
    vehicleModel: "Toyota Camry",
    vehicleColor: "white",
    vehiclePlate: `ABC${Math.floor(Math.random() * 1000)}`,
    vehicleYear: 2020,
    isVerified: true,
    isOnline: true,
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [-74.006, 40.7128], // New York coordinates
    },
    ...additionalData,
  };

  const driver = new Driver(driverData);
  await driver.save();
  return driver;
};

// Create test ride
const createTestRide = async (
  riderId,
  driverId = null,
  additionalData = {}
) => {
  const rideData = {
    riderId,
    driverId,
    pickupLocation: {
      type: "Point",
      coordinates: [-74.006, 40.7128],
      address: "123 Main St, New York, NY",
    },
    destinationLocation: {
      type: "Point",
      coordinates: [-73.9857, 40.7484],
      address: "456 Broadway, New York, NY",
    },
    estimatedDistance: 5.5,
    estimatedDuration: 15,
    estimatedPrice: 12.5,
    ...additionalData,
  };

  const ride = new Ride(rideData);
  await ride.save();
  return ride;
};

// Generate JWT token for testing
const generateTestToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "test-secret", {
    expiresIn: "1h",
  });
};

// Mock locations for testing
const mockLocations = {
  newYork: {
    latitude: 40.7128,
    longitude: -74.006,
    coordinates: [-74.006, 40.7128],
  },
  brooklyn: {
    latitude: 40.6782,
    longitude: -73.9442,
    coordinates: [-73.9442, 40.6782],
  },
  manhattan: {
    latitude: 40.7831,
    longitude: -73.9712,
    coordinates: [-73.9712, 40.7831],
  },
  farAway: {
    latitude: 34.0522,
    longitude: -118.2437,
    coordinates: [-118.2437, 34.0522], // Los Angeles
  },
};

module.exports = {
  createTestUser,
  createTestDriver,
  createTestRide,
  generateTestToken,
  mockLocations,
};
