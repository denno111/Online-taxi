const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth");
const driverRoutes = require("./driver");

// API routes
router.use("/auth", authRoutes);
router.use("/driver", driverRoutes);

// API health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
