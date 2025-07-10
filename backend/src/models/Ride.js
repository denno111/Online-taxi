const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    destinationLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "driver_arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    rideType: {
      type: String,
      enum: ["standard", "premium", "economy"],
      default: "standard",
    },
    estimatedDistance: {
      type: Number, // in kilometers
      required: true,
    },
    estimatedDuration: {
      type: Number, // in minutes
      required: true,
    },
    estimatedPrice: {
      type: Number, // in currency units
      required: true,
    },
    actualPrice: {
      type: Number,
      default: null,
    },
    actualDistance: {
      type: Number,
      default: null,
    },
    actualDuration: {
      type: Number,
      default: null,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    riderNotes: {
      type: String,
      maxlength: 500,
    },
    driverNotes: {
      type: String,
      maxlength: 500,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet"],
      default: "cash",
    },
    rating: {
      riderRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      driverRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      riderReview: {
        type: String,
        maxlength: 500,
      },
      driverReview: {
        type: String,
        maxlength: 500,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
rideSchema.index({ riderId: 1 });
rideSchema.index({ driverId: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ requestedAt: -1 });
rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ destinationLocation: "2dsphere" });

// Compound indexes for common queries
rideSchema.index({ status: 1, requestedAt: -1 });
rideSchema.index({ driverId: 1, status: 1 });
rideSchema.index({ riderId: 1, status: 1 });

module.exports = mongoose.model("Ride", rideSchema);
