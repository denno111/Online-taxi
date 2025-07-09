const request = require("supertest");
const express = require("express");
const errorHandler = require("../../src/middleware/errorHandler");
const AppError = require("../../src/utils/AppError");

describe("Error Handler Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Test routes that throw different types of errors
    app.get("/app-error", (req, res, next) => {
      next(new AppError("Custom application error", 400));
    });

    app.get("/validation-error", (req, res, next) => {
      const error = new Error("Validation failed");
      error.name = "ValidationError";
      error.errors = {
        email: { message: "Email is required" },
        password: { message: "Password is too short" },
      };
      next(error);
    });

    app.get("/cast-error", (req, res, next) => {
      const error = new Error("Cast failed");
      error.name = "CastError";
      error.path = "_id";
      error.value = "invalid-id";
      next(error);
    });

    app.get("/duplicate-error", (req, res, next) => {
      const error = new Error("Duplicate key");
      error.code = 11000;
      error.keyValue = { email: "test@example.com" };
      next(error);
    });

    app.get("/generic-error", (req, res, next) => {
      next(new Error("Generic error"));
    });

    app.get("/async-error", async (req, res, next) => {
      try {
        throw new Error("Async error");
      } catch (error) {
        next(error);
      }
    });

    app.use(errorHandler);
  });

  describe("Error Types", () => {
    it("should handle AppError correctly", async () => {
      const response = await request(app).get("/app-error");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Custom application error");
    });

    it("should handle ValidationError correctly", async () => {
      const response = await request(app).get("/validation-error");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("should handle CastError correctly", async () => {
      const response = await request(app).get("/cast-error");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid _id");
    });

    it("should handle duplicate key error correctly", async () => {
      const response = await request(app).get("/duplicate-error");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should handle generic errors in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const response = await request(app).get("/generic-error");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong");
      expect(response.body.error).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle async errors", async () => {
      const response = await request(app).get("/async-error");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
