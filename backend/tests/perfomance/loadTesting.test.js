const request = require("supertest");
const app = require("../../src/app");
const {
  createTestUser,
  createTestDriver,
  generateTestToken,
} = require("../helpers/testHelpers");

describe("Performance Tests", () => {
  let riders, drivers, tokens;

  beforeAll(async () => {
    // Create multiple test users for load testing
    riders = [];
    drivers = [];
    tokens = { riders: [], drivers: [] };

    // Create 10 riders
    for (let i = 0; i < 10; i++) {
      const rider = await createTestUser("rider", {
        email: `rider${i}@example.com`,
      });
      riders.push(rider);
      tokens.riders.push(generateTestToken(rider._id));
    }

    // Create 10 drivers
    for (let i = 0; i < 10; i++) {
      const driverUser = await createTestUser("driver", {
        email: `driver${i}@example.com`,
      });
      const driver = await createTestDriver(driverUser._id, {
        currentLocation: {
          type: "Point",
          coordinates: [-74.006 + i * 0.01, 40.7128 + i * 0.01],
        },
      });
      drivers.push({ user: driverUser, driver });
      tokens.drivers.push(generateTestToken(driverUser._id));
    }
  }, 30000); // Increase timeout for setup

  describe("Concurrent Ride Requests", () => {
    it("should handle multiple simultaneous ride requests", async () => {
      const rideRequests = riders.map((rider, index) => {
        return request(app)
          .post("/api/rides/request")
          .set("Authorization", `Bearer ${tokens.riders[index]}`)
          .send({
            pickupLocation: {
              type: "Point",
              coordinates: [-74.006 + index * 0.01, 40.7128 + index * 0.01],
              address: `${100 + index} Main St, New York, NY`,
            },
            destinationLocation: {
              type: "Point",
              coordinates: [-73.9857 + index * 0.01, 40.7484 + index * 0.01],
              address: `${200 + index} Broadway, New York, NY`,
            },
            rideType: "standard",
          });
      });

      const startTime = Date.now();
      const responses = await Promise.all(rideRequests);
      const endTime = Date.now();

      // Check that all requests were processed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Check response time (should be under 5 seconds for 10 requests)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000);

      console.log(
        `Processed ${responses.length} ride requests in ${totalTime}ms`
      );
    });
  });

  describe("Location Updates Performance", () => {
    it("should handle rapid location updates", async () => {
      const locationUpdates = [];

      // Generate 100 location updates for each driver
      for (let driverIndex = 0; driverIndex < 5; driverIndex++) {
        for (let i = 0; i < 20; i++) {
          locationUpdates.push(
            request(app)
              .post("/api/location/update")
              .set("Authorization", `Bearer ${tokens.drivers[driverIndex]}`)
              .send({
                latitude: 40.7128 + i * 0.001,
                longitude: -74.006 + i * 0.001,
                heading: i * 10,
                speed: 25 + i,
              })
          );
        }
      }

      const startTime = Date.now();
      const responses = await Promise.all(locationUpdates);
      const endTime = Date.now();

      // Check that all updates were processed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      const updatesPerSecond = (locationUpdates.length / totalTime) * 1000;

      console.log(
        `Processed ${locationUpdates.length} location updates in ${totalTime}ms`
      );
      console.log(`Rate: ${updatesPerSecond.toFixed(2)} updates/second`);

      // Should handle at least 10 updates per second
      expect(updatesPerSecond).toBeGreaterThan(10);
    });
  });

  describe("Driver Matching Performance", () => {
    it("should find drivers quickly even with many options", async () => {
      const searchRequests = [];

      // Create 50 search requests
      for (let i = 0; i < 50; i++) {
        searchRequests.push(
          request(app)
            .get("/api/location/nearby-drivers")
            .set("Authorization", `Bearer ${tokens.riders[i % riders.length]}`)
            .query({
              latitude: 40.7128 + i * 0.001,
              longitude: -74.006 + i * 0.001,
              radius: 5,
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(searchRequests);
      const endTime = Date.now();

      // Check that all searches were processed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      const searchesPerSecond = (searchRequests.length / totalTime) * 1000;

      console.log(
        `Processed ${searchRequests.length} driver searches in ${totalTime}ms`
      );
      console.log(`Rate: ${searchesPerSecond.toFixed(2)} searches/second`);

      // Should handle at least 20 searches per second
      expect(searchesPerSecond).toBeGreaterThan(20);
    });
  });
});
