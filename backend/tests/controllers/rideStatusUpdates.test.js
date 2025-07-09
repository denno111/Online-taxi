const request = require("supertest");
const app = require("../../src/app");
const {
  createTestUser,
  createTestDriver,
  createTestRide,
  generateTestToken,
} = require("../helpers/testHelpers");

describe("Ride Status Updates", () => {
  let rider, driverUser, driver, ride, riderToken, driverToken;

  beforeEach(async () => {
    rider = await createTestUser("rider");
    driverUser = await createTestUser("driver");
    driver = await createTestDriver(driverUser._id);
    ride = await createTestRide(rider._id, driverUser._id, {
      status: "accepted",
    });

    riderToken = generateTestToken(rider._id);
    driverToken = generateTestToken(driverUser._id);
  });

  describe("PATCH /api/rides/:rideId/status", () => {
    it("should update ride status to driver_arrived", async () => {
      const response = await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: "driver_arrived" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("driver_arrived");
      expect(response.body.data.arrivedAt).toBeDefined();
    });

    it("should update ride status to in_progress", async () => {
      // First set to driver_arrived
      await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: "driver_arrived" });

      // Then set to in_progress
      const response = await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: "in_progress" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("in_progress");
      expect(response.body.data.startedAt).toBeDefined();
    });

    it("should update ride status to completed", async () => {
      // Set up ride progression
      await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: "driver_arrived" });

      await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: "in_progress" });

      // Complete the ride
      const response = await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: "completed" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("completed");
      expect(response.body.data.completedAt).toBeDefined();
      expect(response.body.data.actualPrice).toBeDefined();
    });

    it("should reject invalid status transitions", async () => {
      // Try to go directly from accepted to completed
      const response = await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: "completed" });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid status transition");
    });

    it("should reject unauthorized status updates", async () => {
      const unauthorizedUser = await createTestUser("rider");
      const unauthorizedToken = generateTestToken(unauthorizedUser._id);

      const response = await request(app)
        .patch(`/api/rides/${ride._id}/status`)
        .set("Authorization", `Bearer ${unauthorizedToken}`)
        .send({ status: "driver_arrived" });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Not authorized");
    });
  });
});
