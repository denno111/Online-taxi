const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, "License expiry date is required"],
    },
    vehicleModel: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },
    vehiclePlate: {
      type: String,
      required: [true, "Vehicle plate is required"],
      trim: true,
      uppercase: true,
    },
    vehicleColor: {
      type: String,
      required: [true, "Vehicle color is required"],
      trim: true,
    },
    vehicleYear: {
      type: Number,
      required: [true, "Vehicle year is required"],
      min: [1990, "Vehicle must be from 1990 or later"],
      max: [new Date().getFullYear() + 1, "Invalid vehicle year"],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    totalRides: {
      type: Number,
      default: 0,
      min: [0, "Total rides cannot be negative"],
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, "Total earnings cannot be negative"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: {
      licensePhoto: String,
      vehicleRegistration: String,
      insurance: String,
    },
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      accountHolderName: String,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    currentRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },
    acceptanceRate: {
      type: Number,
      default: 100.0,
      min: 0,
      max: 100,
    },
    completionRate: {
      type: Number,
      default: 100.0,
      min: 0,
      max: 100,
    },
    averageResponseTime: {
      type: Number, // in seconds
      default: 30,
    },
    lastLocationUpdate: {
      type: Date,
      default: null,
    },
    workingHours: {
      start: {
        type: String,
        default: "06:00",
      },
      end: {
        type: String,
        default: "22:00",
      },
    },
    preferences: {
      maxDistance: {
        type: Number, // in kilometers
        default: 10,
      },
      rideTypes: [
        {
          type: String,
          enum: ["standard", "premium", "economy"],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location queries
driverSchema.index({ currentLocation: "2dsphere" });
driverSchema.index({ isOnline: 1 });
driverSchema.index({ isVerified: 1 });
driverSchema.index({ isAvailable: 1 });
driverSchema.index({ currentRideId: 1 });
module.exports = mongoose.model("Driver", driverSchema);
// This code defines a Mongoose schema for a Driver model in a Node.js application.
// It includes fields for user ID, license information, vehicle details, online status, and location.
