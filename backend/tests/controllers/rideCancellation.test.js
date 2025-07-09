const request = require("supertest");
const app = require("../../src/app");
const {
  createTestUser,
  createTestDriver,
  createTestRide,
  generateTestToken,
} = require("../helpers/testHelpers");

describe("Ride Cancellation", () => {
  let rider, driverUser, driver, ride, riderToken, driverToken;

  beforeEach(async () => {
    rider = await createTestUser("rider");
    driverUser = await createTestUser("driver");
    driver = await createTestDriver(driverUser._id);

    riderToken = generateTestToken(rider._id);
    driverToken = generateTestToken(driverUser._id);
  });

  describe("DELETE /api/rides/:rideId/cancel", () => {
    beforeEach(async () => {
      ride = await createTestRide(rider._id, null, { status: "pending" });
    });

    it("should cancel pending ride by rider", async () => {
      const response = await request(app)
        .delete(`/api/rides/${ride._id}/cancel`)
        .set("Authorization", `Bearer ${riderToken}`)
        .send({ reason: "Change of plans" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("cancelled");
      expect(response.body.data.cancellationReason).toBe("Change of plans");
      expect(response.body.data.cancelledBy).toBe(rider._id.toString());
    });

    it("should cancel accepted ride by driver", async () => {
      // Update ride to accepted status
      ride.status = "accepted";
      ride.driverId = driverUser._id;
      await ride.save();

      const response = await request(app)
        .delete(`/api/rides/${ride._id}/cancel`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ reason: "Vehicle breakdown" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("cancelled");
      expect(response.body.data.cancellationReason).toBe("Vehicle breakdown");
      expect(response.body.data.cancelledBy).toBe(driverUser._id.toString());
    });

    it("should apply cancellation fee for late cancellation", async () => {
      // Create ride that was accepted 10 minutes ago
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      ride.status = "accepted";
      ride.driverId = driverUser._id;
      ride.acceptedAt = tenMinutesAgo;
      await ride.save();

      const response = await request(app)
        .delete(`/api/rides/${ride._id}/cancel`)
        .set("Authorization", `Bearer ${riderToken}`)
        .send({ reason: "Change of plans" });

      expect(response.status).toBe(200);
      expect(response.body.data.cancellationFee).toBeDefined();
      expect(response.body.data.cancellationFee).toBeGreaterThan(0);
    });

    it("should not allow cancellation of in-progress rides", async () => {
      ride.status = "in_progress";
      ride.driverId = driverUser._id;
      await ride.save();

      const response = await request(app)
        .delete(`/api/rides/${ride._id}/cancel`)
        .set("Authorization", `Bearer ${riderToken}`)
        .send({ reason: "Change of plans" });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Cannot cancel ride in progress");
    });

    it("should not allow cancellation by unauthorized user", async () => {
      const unauthorizedUser = await createTestUser("rider");
      const unauthorizedToken = generateTestToken(unauthorizedUser._id);

      const response = await request(app)
        .delete(`/api/rides/${ride._id}/cancel`)
        .set("Authorization", `Bearer ${unauthorizedToken}`)
        .send({ reason: "Test" });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Not authorized");
    });
  });
});
