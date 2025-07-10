const Driver = require("../models/Driver");
const { sendResponse, sendError } = require("../utils/response");

const createDriverProfile = async (req, res) => {
  try {
    const {
      licenseNumber,
      licenseExpiry,
      vehicleModel,
      vehiclePlate,
      vehicleColor,
      vehicleYear,
    } = req.body;
    const userId = req.user._id;

    // Check if driver profile already exists
    const existingDriver = await Driver.findOne({ userId });
    if (existingDriver) {
      return sendError(res, 400, "Driver profile already exists");
    }

    // Check if license number is already taken
    const existingLicense = await Driver.findOne({ licenseNumber });
    if (existingLicense) {
      return sendError(res, 400, "License number is already registered");
    }

    // Create driver profile
    const driver = new Driver({
      userId,
      licenseNumber,
      licenseExpiry,
      vehicleModel,
      vehiclePlate,
      vehicleColor,
      vehicleYear,
    });

    await driver.save();

    sendResponse(res, 201, true, "Driver profile created successfully", driver);
  } catch (error) {
    console.error("Create driver profile error:", error);
    sendError(res, 500, "Failed to create driver profile", error.message);
  }
};

const updateDriverProfile = async (req, res) => {
  try {
    const {
      licenseNumber,
      licenseExpiry,
      vehicleModel,
      vehiclePlate,
      vehicleColor,
      vehicleYear,
    } = req.body;
    const userId = req.user._id;

    // Check if license number is already taken by another driver
    if (licenseNumber) {
      const existingDriver = await Driver.findOne({
        licenseNumber,
        userId: { $ne: userId },
      });

      if (existingDriver) {
        return sendError(res, 400, "License number is already taken");
      }
    }

    // Update driver profile
    const updatedDriver = await Driver.findOneAndUpdate(
      { userId },
      {
        licenseNumber,
        licenseExpiry,
        vehicleModel,
        vehiclePlate,
        vehicleColor,
        vehicleYear,
      },
      { new: true, runValidators: true }
    );

    if (!updatedDriver) {
      return sendError(res, 404, "Driver profile not found");
    }

    sendResponse(
      res,
      200,
      true,
      "Driver profile updated successfully",
      updatedDriver
    );
  } catch (error) {
    console.error("Update driver profile error:", error);
    sendError(res, 500, "Failed to update driver profile", error.message);
  }
};

const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const driver = await Driver.findOne({ userId }).populate(
      "userId",
      "firstName lastName email phone"
    );

    if (!driver) {
      return sendError(res, 404, "Driver profile not found");
    }

    sendResponse(
      res,
      200,
      true,
      "Driver profile retrieved successfully",
      driver
    );
  } catch (error) {
    console.error("Get driver profile error:", error);
    sendError(res, 500, "Failed to retrieve driver profile", error.message);
  }
};

module.exports = { createDriverProfile, updateDriverProfile, getDriverProfile };
// This code defines a controller for managing driver profiles in a taxi platform application.
