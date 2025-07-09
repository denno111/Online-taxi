const mongoose = require("mongoose");

const locationTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    heading: {
      type: Number, // in degrees
      default: null,
    },
    speed: {
      type: Number, // in km/h
      default: null,
    },
    accuracy: {
      type: Number, // in meters
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete old location data after 24 hours
locationTrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

// Geospatial index for location queries
locationTrackingSchema.index({ location: "2dsphere" });

// Compound indexes
locationTrackingSchema.index({ userId: 1, timestamp: -1 });
locationTrackingSchema.index({ rideId: 1, timestamp: -1 });

module.exports = mongoose.model("LocationTracking", locationTrackingSchema);
