const request = require("supertest");
const app = require("../../src/app");
const LocationTracking = require("../../src/models/LocationTracking");
const {
  createTestUser,
  createTestDriver,
  generateTestToken,
  mockLocations,
} = require("../helpers/testHelpers");

describe("Location Controller", () => {
  let rider, driverUser, driver, riderToken, driverToken;

  beforeEach(async () => {
    rider = await createTestUser("rider");
    driverUser = await createTestUser("driver");
    driver = await createTestDriver(driverUser._id);

    riderToken = generateTestToken(rider._id);
    driverToken = generateTestToken(driverUser._id);
  });

  describe("POST /api/location/update", () => {
    it("should update driver location successfully", async () => {
      const locationData = {
        latitude: mockLocations.newYork.latitude,
        longitude: mockLocations.newYork.longitude,
        heading: 90,
        speed: 25,
        accuracy: 5,
      };

      const response = await request(app)
        .post("/api/location/update")
        .set("Authorization", `Bearer ${driverToken}`)
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.latitude).toBe(locationData.latitude);
      expect(response.body.data.longitude).toBe(locationData.longitude);

      // Verify location was saved in database
      const savedLocation = await LocationTracking.findOne({
        userId: driverUser._id,
      });
      expect(savedLocation).toBeDefined();
      expect(savedLocation.location.coordinates).toEqual([
        locationData.longitude,
        locationData.latitude,
      ]);
    });

    it("should update rider location successfully", async () => {
      const locationData = {
        latitude: mockLocations.brooklyn.latitude,
        longitude: mockLocations.brooklyn.longitude,
        accuracy: 10,
      };

      const response = await request(app)
        .post("/api/location/update")
        .set("Authorization", `Bearer ${riderToken}`)
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject invalid coordinates", async () => {
      const invalidLocationData = {
        latitude: 200, // Invalid latitude
        longitude: -74.006,
      };

      const response = await request(app)
        .post("/api/location/update")
        .set("Authorization", `Bearer ${driverToken}`)
        .send(invalidLocationData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Validation failed");
    });

    it("should require authentication", async () => {
      const locationData = {
        latitude: mockLocations.newYork.latitude,
        longitude: mockLocations.newYork.longitude,
      };

      const response = await request(app)
        .post("/api/location/update")
        .send(locationData);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/location/nearby-drivers", () => {
    beforeEach(async () => {
      // Create additional drivers at different locations
      const driver2User = await createTestUser("driver");
      await createTestDriver(driver2User._id, {
        currentLocation: {
          type: "Point",
          coordinates: mockLocations.brooklyn.coordinates,
        },
      });

      const driver3User = await createTestUser("driver");
      await createTestDriver(driver3User._id, {
        currentLocation: {
          type: "Point",
          coordinates: mockLocations.farAway.coordinates,
        },
      });
    });

    it("should find nearby drivers", async () => {
      const response = await request(app)
        .get("/api/location/nearby-drivers")
        .set("Authorization", `Bearer ${riderToken}`)
        .query({
          latitude: mockLocations.newYork.latitude,
          longitude: mockLocations.newYork.longitude,
          radius: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drivers).toBeDefined();
      expect(Array.isArray(response.body.data.drivers)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it("should not find drivers outside radius", async () => {
      const response = await request(app)
        .get("/api/location/nearby-drivers")
        .set("Authorization", `Bearer ${riderToken}`)
        .query({
          latitude: mockLocations.newYork.latitude,
          longitude: mockLocations.newYork.longitude,
          radius: 1, // Very small radius
        });

      expect(response.status).toBe(200);
      expect(response.body.data.drivers.length).toBeLessThan(3);
    });

    it("should require latitude and longitude", async () => {
      const response = await request(app)
        .get("/api/location/nearby-drivers")
        .set("Authorization", `Bearer ${riderToken}`)
        .query({ radius: 5 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        "Latitude and longitude are required"
      );
    });
  });
});
