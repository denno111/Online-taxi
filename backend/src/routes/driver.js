const express = require("express");
const router = express.Router();
const {
  createDriverProfile,
  updateDriverProfile,
  getDriverProfile,
} = require("../controllers/driverController");
const { authenticate, authorize } = require("../middleware/auth");
const { validateDriverProfile } = require("../middleware/validation");

// Protected routes for drivers only
router.post(
  "/profile",
  authenticate,
  authorize("driver"),
  validateDriverProfile,
  createDriverProfile
);
router.put(
  "/profile",
  authenticate,
  authorize("driver"),
  validateDriverProfile,
  updateDriverProfile
);
router.get("/profile", authenticate, authorize("driver"), getDriverProfile);

module.exports = router;
