const request = require("supertest");
const express = require("express");
const { body, validationResult } = require("express-validator");
const validationMiddleware = require("../../src/middleware/validation");

describe("Validation Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Test route with validation
    app.post(
      "/test-user",
      [
        body("email").isEmail().normalizeEmail(),
        body("password").isLength({ min: 8 }),
        body("phone").isMobilePhone(),
        body("userType").isIn(["rider", "driver"]),
        validationMiddleware,
      ],
      (req, res) => {
        res.json({ success: true, data: req.body });
      }
    );

    // Test route for location validation
    app.post(
      "/test-location",
      [
        body("latitude").isFloat({ min: -90, max: 90 }),
        body("longitude").isFloat({ min: -180, max: 180 }),
        body("address").isLength({ min: 5 }),
        validationMiddleware,
      ],
      (req, res) => {
        res.json({ success: true, data: req.body });
      }
    );
  });

  describe("User Validation", () => {
    it("should pass validation with valid user data", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        phone: "+1234567890",
        userType: "rider",
      };

      const response = await request(app).post("/test-user").send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject invalid email format", async () => {
      const userData = {
        email: "invalid-email",
        password: "password123",
        phone: "+1234567890",
        userType: "rider",
      };

      const response = await request(app).post("/test-user").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Validation failed");
      expect(response.body.errors.some((err) => err.field === "email")).toBe(
        true
      );
    });

    it("should reject weak password", async () => {
      const userData = {
        email: "test@example.com",
        password: "123",
        phone: "+1234567890",
        userType: "rider",
      };

      const response = await request(app).post("/test-user").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors.some((err) => err.field === "password")).toBe(
        true
      );
    });

    it("should reject invalid user type", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        phone: "+1234567890",
        userType: "invalid",
      };

      const response = await request(app).post("/test-user").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors.some((err) => err.field === "userType")).toBe(
        true
      );
    });
  });

  describe("Location Validation", () => {
    it("should pass validation with valid location data", async () => {
      const locationData = {
        latitude: 40.7128,
        longitude: -74.006,
        address: "123 Main Street, New York, NY",
      };

      const response = await request(app)
        .post("/test-location")
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject invalid latitude", async () => {
      const locationData = {
        latitude: 200, // Invalid latitude
        longitude: -74.006,
        address: "123 Main Street, New York, NY",
      };

      const response = await request(app)
        .post("/test-location")
        .send(locationData);

      expect(response.status).toBe(400);
      expect(response.body.errors.some((err) => err.field === "latitude")).toBe(
        true
      );
    });

    it("should reject invalid longitude", async () => {
      const locationData = {
        latitude: 40.7128,
        longitude: 200, // Invalid longitude
        address: "123 Main Street, New York, NY",
      };

      const response = await request(app)
        .post("/test-location")
        .send(locationData);

      expect(response.status).toBe(400);
      expect(
        response.body.errors.some((err) => err.field === "longitude")
      ).toBe(true);
    });
  });
});
