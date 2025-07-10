// backend/src/app.js (Corrected Version)

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRoutes = require("./routes/api");
const { sendError } = require("./utils/response");
const rideRoutes = require("./routes/rideRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration (Using a more flexible approach from my previous suggestion)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:3001", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) or from whitelisted origins
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API routes
app.use("/api", apiRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/location", locationRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Taxi Platform API",
    version: "1.0.0",
    status: "running",
  });
});

// --- FIX STARTS HERE ---

// 404 handler: This now correctly catches any request that doesn't match a route
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error); // Pass the error to the global error handler
});

// Global error handler: This now handles all errors passed via next()
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    return sendError(res, 400, "Validation Error", err.message);
  }

  if (err.name === "MongoError" && err.code === 11000) {
    return sendError(res, 400, "Duplicate field error");
  }

  // For our 404 handler
  if (statusCode === 404) {
    return sendError(res, 404, message);
  }

  // Default to 500 server error
  sendError(res, statusCode, message);
});

// --- FIX ENDS HERE ---

module.exports = app;
