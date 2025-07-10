const express = require("express");
const router = express.Router();
const {
  updateLocation,
  getNearbyDrivers,
  getRideLocationHistory,
} = require("../controllers/locationController");
const { authenticate } = require("../middleware/auth");
const { validateLocationUpdate } = require("../middleware/validation");

// All routes require authentication
router.use(authenticate);

// Location routes
router.post("/update", validateLocationUpdate, updateLocation);
router.get("/nearby-drivers", getNearbyDrivers);
router.get("/ride/:rideId/history", getRideLocationHistory);

module.exports = router;
