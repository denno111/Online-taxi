const Joi = require("joi");
const { sendError } = require("../utils/response");

/**
 * A helper function to create a consistent validation middleware
 * @param {Joi.Schema} schema - The Joi schema to validate against
 * @returns {function} Express middleware function
 */
const createValidator = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    // Return the first error message for a simple, clear response
    const errorMessage = error.details[0].message;
    return sendError(res, 400, "Validation Failed", errorMessage);
  }
  next();
};

// --- User & Auth Schemas ---

const registrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Please provide a valid phone number.",
      "any.required": "Phone number is required.",
    }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long.",
    "any.required": "Password is required.",
  }),
  firstName: Joi.string().trim().max(50).required().messages({
    "string.max": "First name cannot exceed 50 characters.",
    "any.required": "First name is required.",
  }),
  lastName: Joi.string().trim().max(50).required().messages({
    "string.max": "Last name cannot exceed 50 characters.",
    "any.required": "Last name is required.",
  }),
  userType: Joi.string().valid("rider", "driver").required().messages({
    "any.only": "User type must be either 'rider' or 'driver'.",
    "any.required": "User type is required.",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
  }),
});

// --- Driver Schema ---

const driverProfileSchema = Joi.object({
  licenseNumber: Joi.string().required().messages({
    "any.required": "License number is required.",
  }),
  licenseExpiry: Joi.date().greater("now").required().messages({
    "date.greater": "License expiry date must be in the future.",
    "any.required": "License expiry date is required.",
  }),
  vehicleModel: Joi.string().required().messages({
    "any.required": "Vehicle model is required.",
  }),
  vehiclePlate: Joi.string().required().messages({
    "any.required": "Vehicle plate is required.",
  }),
  vehicleColor: Joi.string().required().messages({
    "any.required": "Vehicle color is required.",
  }),
  vehicleYear: Joi.number()
    .integer()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .required()
    .messages({
      "number.min": "Vehicle must be from 1990 or later.",
      "number.max": "Invalid vehicle year.",
      "any.required": "Vehicle year is required.",
    }),
});

// --- Ride Schemas ---

const rideRequestSchema = Joi.object({
  pickupLocation: Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string().required(),
  }).required(),
  destinationLocation: Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string().required(),
  }).required(),
  rideType: Joi.string().valid("standard", "premium", "economy").optional(),
  riderNotes: Joi.string().max(500).allow("").optional(), // allow empty string
});

const rideStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "accepted",
      "driver_arrived",
      "in_progress",
      "completed",
      "cancelled"
    )
    .required(),
});

// --- Location Schema ---

const locationUpdateSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  heading: Joi.number().min(0).max(360).optional(),
  speed: Joi.number().min(0).optional(),
  accuracy: Joi.number().min(0).optional(),
});

// --- EXPORT ALL VALIDATORS ---
module.exports = {
  validateRegistration: createValidator(registrationSchema),
  validateLogin: createValidator(loginSchema),
  validateDriverProfile: createValidator(driverProfileSchema),
  validateRideRequest: createValidator(rideRequestSchema),
  validateRideStatus: createValidator(rideStatusSchema),
  validateLocationUpdate: createValidator(locationUpdateSchema),
};
