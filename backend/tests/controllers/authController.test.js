const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const { createTestUser } = require("../helpers/testHelpers");

describe("Authentication Controller", () => {
  describe("POST /api/auth/register", () => {
    it("should register new user successfully", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        password: "password123",
        userType: "rider",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.userType).toBe(userData.userType);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should reject registration with existing email", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        password: "password123",
        userType: "rider",
      };

      // Create first user
      await request(app).post("/api/auth/register").send(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("already exists");
    });

    it("should reject registration with invalid email format", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        phone: "+1234567890",
        password: "password123",
        userType: "rider",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("valid email");
    });

    it("should reject registration with weak password", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        password: "123", // Too weak
        userType: "rider",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Password must be");
    });
  });

  describe("POST /api/auth/login", () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser("rider", {
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should reject login with invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should reject login for unverified user", async () => {
      // Create unverified user
      user.isEmailVerified = false;
      await user.save();

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("verify");
    });
  });

  describe("POST /api/auth/logout", () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser("rider");
      const response = await request(app).post("/api/auth/login").send({
        email: user.email,
        password: "password123",
      });
      token = response.body.data.token;
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Logged out successfully");
    });

    it("should require authentication", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(401);
    });
  });
});
