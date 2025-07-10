const { verifyToken } = require("../utils/jwt");
const { sendError } = require("../utils/response");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return sendError(res, 401, "Invalid token. User not found.");
    }

    if (!user.isActive) {
      return sendError(res, 401, "Account has been deactivated.");
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, "Invalid token.");
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return sendError(res, 403, "Access denied. Insufficient permissions.");
    }
    next();
  };
};

module.exports = { authenticate, authorize };
