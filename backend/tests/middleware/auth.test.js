const request = require("supertest");
const express = require("express");
const auth = require("../../src/middleware/auth");
const { createTestUser, generateTestToken } = require("../helpers/testHelpers");

describe("Auth Middleware", () => {
  let app, user, token;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Protected route for testing
    app.get("/protected", auth, (req, res) => {
      res.json({ success: true, user: req.user });
    });

    // Route that requires specific user type
    app.get("/driver-only", auth, (req, res) => {
      if (req.user.userType !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      res.json({ success: true });
    });

    user = await createTestUser("rider");
    token = generateTestToken(user._id);
  });

  describe("Authentication", () => {
    it("should allow access with valid token", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user._id).toBe(user._id.toString());
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/protected");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Access token required");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid token");
    });

    it("should reject request with malformed authorization header", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "InvalidFormat");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Access token required");
    });
  });

  describe("User Type Authorization", () => {
    it("should allow driver access to driver-only route", async () => {
      const driver = await createTestUser("driver");
      const driverToken = generateTestToken(driver._id);

      const response = await request(app)
        .get("/driver-only")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject rider access to driver-only route", async () => {
      const response = await request(app)
        .get("/driver-only")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Driver access required");
    });
  });
});
