const User = require("../models/User");
const Driver = require("../models/Driver");
const { generateToken } = require("../utils/jwt");
const { sendResponse, sendError } = require("../utils/response");

const register = async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return sendError(
        res,
        400,
        "User with this email or phone already exists"
      );
    }

    // Create new user
    const user = new User({
      email,
      phone,
      password,
      firstName,
      lastName,
      userType,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({ userId: user._id, userType: user.userType });

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    sendResponse(res, 201, true, "User registered successfully", {
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    sendError(res, 500, "Registration failed", error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    // Check if account is active
    if (!user.isActive) {
      return sendError(res, 401, "Account has been deactivated");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password");
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id, userType: user.userType });

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    sendResponse(res, 200, true, "Login successful", {
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, 500, "Login failed", error.message);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    let profile = { ...user.toJSON() };

    // If user is a driver, get driver-specific information
    if (user.userType === "driver") {
      const driverInfo = await Driver.findOne({ userId: user._id });
      if (driverInfo) {
        profile.driverInfo = driverInfo;
      }
    }

    sendResponse(res, 200, true, "Profile retrieved successfully", profile);
  } catch (error) {
    console.error("Get profile error:", error);
    sendError(res, 500, "Failed to retrieve profile", error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user._id;

    // Check if phone number is already taken by another user
    if (phone) {
      const existingUser = await User.findOne({
        phone,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return sendError(res, 400, "Phone number is already taken");
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    );

    sendResponse(
      res,
      200,
      true,
      "Profile updated successfully",
      updatedUser.toJSON()
    );
  } catch (error) {
    console.error("Update profile error:", error);
    sendError(res, 500, "Failed to update profile", error.message);
  }
};

module.exports = { register, login, getProfile, updateProfile };
