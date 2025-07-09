const request = require("supertest");
const app = require("../../src/app");
const {
  createTestUser,
  createTestDriver,
  generateTestToken,
  mockLocations,
} = require("../helpers/testHelpers");

describe("Ride Controller", () => {
  describe("POST /api/rides/request", () => {
    let rider, token;

    beforeEach(async () => {
      rider = await createTestUser("rider");
      token = generateTestToken(rider._id);
    });

    it("should create a ride request successfully", async () => {
      const rideData = {
        pickupLocation: {
          type: "Point",
          coordinates: mockLocations.newYork.coordinates,
          address: "123 Main St, New York, NY",
        },
        destinationLocation: {
          type: "Point",
          coordinates: mockLocations.brooklyn.coordinates,
          address: "456 Broadway, Brooklyn, NY",
        },
        rideType: "standard",
        riderNotes: "Please call when you arrive",
      };

      const response = await request(app)
        .post("/api/rides/request")
        .set("Authorization", `Bearer ${token}`)
        .send(rideData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ride).toBeDefined();
      expect(response.body.data.ride.riderId).toBe(rider._id.toString());
      expect(response.body.data.ride.status).toBe("pending");
      expect(response.body.data.pricing).toBeDefined();
    });

    it("should reject ride request with invalid pickup location", async () => {
      const rideData = {
        pickupLocation: {
          type: "Point",
          coordinates: [200, 100], // Invalid coordinates
          address: "123 Main St, New York, NY",
        },
        destinationLocation: {
          type: "Point",
          coordinates: mockLocations.brooklyn.coordinates,
          address: "456 Broadway, Brooklyn, NY",
        },
      };

      const response = await request(app)
        .post("/api/rides/request")
        .set("Authorization", `Bearer ${token}`)
        .send(rideData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject duplicate ride request", async () => {
      // Create first ride request
      const rideData = {
        pickupLocation: {
          type: "Point",
          coordinates: mockLocations.newYork.coordinates,
          address: "123 Main St, New York, NY",
        },
        destinationLocation: {
          type: "Point",
          coordinates: mockLocations.brooklyn.coordinates,
          address: "456 Broadway, Brooklyn, NY",
        },
      };

      await request(app)
        .post("/api/rides/request")
        .set("Authorization", `Bearer ${token}`)
        .send(rideData);

      // Try to create second ride request
      const response = await request(app)
        .post("/api/rides/request")
        .set("Authorization", `Bearer ${token}`)
        .send(rideData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("active ride request");
    });

    it("should handle no available drivers", async () => {
      const rideData = {
        pickupLocation: {
          type: "Point",
          coordinates: mockLocations.farAway.coordinates,
          address: "123 Main St, Los Angeles, CA",
        },
        destinationLocation: {
          type: "Point",
          coordinates: [-118.2437, 34.0522],
          address: "456 Broadway, Los Angeles, CA",
        },
      };

      const response = await request(app)
        .post("/api/rides/request")
        .set("Authorization", `Bearer ${token}`)
        .send(rideData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("No drivers available");
    });
  });

  describe("POST /api/rides/:rideId/accept", () => {
    let rider, driver, driverUser, ride, riderToken, driverToken;

    beforeEach(async () => {
      rider = await createTestUser("rider");
      driverUser = await createTestUser("driver");
      driver = await createTestDriver(driverUser._id);
      ride = await createTestRide(rider._id);

      riderToken = generateTestToken(rider._id);
      driverToken = generateTestToken(driverUser._id);
    });

    it("should accept ride successfully", async () => {
      const response = await request(app)
        .post(`/api/rides/${ride._id}/accept`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("accepted");
      expect(response.body.data.driverId).toBe(driverUser._id.toString());
    });

    it("should reject acceptance by non-driver", async () => {
      const response = await request(app)
        .post(`/api/rides/${ride._id}/accept`)
        .set("Authorization", `Bearer ${riderToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Driver profile not found");
    });

    it("should reject acceptance of non-existent ride", async () => {
      const fakeRideId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .post(`/api/rides/${fakeRideId}/accept`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Ride not found");
    });
  });
});
