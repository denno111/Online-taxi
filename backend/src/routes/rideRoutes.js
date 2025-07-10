const express = require("express");
const router = express.Router();
const {
  createRideRequest,
  acceptRideRequest,
  updateRideStatus,
  getRideDetails,
  getRideHistory,
  getActiveRide,
  cancelRide,
} = require("../controllers/rideController");
const { authenticate } = require("../middleware/auth");
const {
  validateRideRequest,
  validateRideStatus,
} = require("../middleware/validation");

// All routes require authentication
router.use(authenticate);

// Ride request routes
router.post("/request", validateRideRequest, createRideRequest);
router.post("/:rideId/accept", acceptRideRequest);
router.patch("/:rideId/status", validateRideStatus, updateRideStatus);
router.delete("/:rideId/cancel", cancelRide);

// Ride information routes
router.get("/active", getActiveRide);
router.get("/history", getRideHistory);
router.get("/:rideId", getRideDetails);

module.exports = router;
