const { findBestDriver } = require("../../src/services/rideMatchingService");
const {
  createTestUser,
  createTestDriver,
  mockLocations,
} = require("../helpers/testHelpers");

describe("Ride Matching Service", () => {
  describe("findBestDriver", () => {
    let riders, drivers, driverUsers;

    beforeEach(async () => {
      // Create test riders
      riders = await Promise.all([
        createTestUser("rider"),
        createTestUser("rider"),
      ]);

      // Create test drivers with different attributes
      driverUsers = await Promise.all([
        createTestUser("driver"),
        createTestUser("driver"),
        createTestUser("driver"),
      ]);

      drivers = await Promise.all([
        // Close driver with good rating
        createTestDriver(driverUsers[0]._id, {
          currentLocation: {
            type: "Point",
            coordinates: [-74.006, 40.7128], // Very close to pickup
          },
          rating: 4.8,
          acceptanceRate: 95,
          averageResponseTime: 15,
        }),

        // Farther driver with excellent rating
        createTestDriver(driverUsers[1]._id, {
          currentLocation: {
            type: "Point",
            coordinates: [-74.02, 40.72], // Farther from pickup
          },
          rating: 5.0,
          acceptanceRate: 98,
          averageResponseTime: 10,
        }),

        // Close driver with lower rating
        createTestDriver(driverUsers[2]._id, {
          currentLocation: {
            type: "Point",
            coordinates: [-74.007, 40.713], // Close to pickup
          },
          rating: 3.5,
          acceptanceRate: 80,
          averageResponseTime: 25,
        }),
      ]);
    });

    it("should find the best driver based on scoring algorithm", async () => {
      const rideRequest = {
        pickupLocation: {
          type: "Point",
          coordinates: [-74.006, 40.7128],
        },
        rideType: "standard",
      };

      const bestDriver = await findBestDriver(rideRequest);

      expect(bestDriver).toBeDefined();
      expect(bestDriver.userId).toBeDefined();
      expect(bestDriver.isAvailable).toBe(true);
      expect(bestDriver.isOnline).toBe(true);
    });

    it("should return null when no drivers available", async () => {
      // Mark all drivers as unavailable
      await Promise.all(
        drivers.map((driver) => {
          driver.isAvailable = false;
          return driver.save();
        })
      );

      const rideRequest = {
        pickupLocation: {
          type: "Point",
          coordinates: [-74.006, 40.7128],
        },
        rideType: "standard",
      };

      const bestDriver = await findBestDriver(rideRequest);

      expect(bestDriver).toBeNull();
    });

    it("should prioritize drivers with ride type preference", async () => {
      // Set first driver to prefer premium rides
      drivers[0].preferences.rideTypes = ["premium"];
      await drivers[0].save();

      // Set second driver to prefer standard rides
      drivers[1].preferences.rideTypes = ["standard"];
      await drivers[1].save();

      const rideRequest = {
        pickupLocation: {
          type: "Point",
          coordinates: [-74.006, 40.7128],
        },
        rideType: "standard",
      };

      const bestDriver = await findBestDriver(rideRequest);

      expect(bestDriver).toBeDefined();
      expect(bestDriver.preferences.rideTypes).toContain("standard");
    });

    it("should not select offline drivers", async () => {
      // Mark all drivers as offline
      await Promise.all(
        drivers.map((driver) => {
          driver.isOnline = false;
          return driver.save();
        })
      );

      const rideRequest = {
        pickupLocation: {
          type: "Point",
          coordinates: [-74.006, 40.7128],
        },
        rideType: "standard",
      };

      const bestDriver = await findBestDriver(rideRequest);

      expect(bestDriver).toBeNull();
    });
  });
});
