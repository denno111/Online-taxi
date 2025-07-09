const request = require("supertest");
const app = require("../../src/app");
const {
  createTestUser,
  createTestDriver,
  generateTestToken,
  mockLocations,
} = require("../helpers/testHelpers");

describe("Complete Ride Flow Integration", () => {
  let rider, driverUser, driver, anotherDriverUser, anotherDriver;
  let riderToken, driverToken, anotherDriverToken;

  beforeEach(async () => {
    // Create test users
    rider = await createTestUser("rider");
    driverUser = await createTestUser("driver");
    anotherDriverUser = await createTestUser("driver");

    // Create driver profiles
    driver = await createTestDriver(driverUser._id, {
      currentLocation: {
        type: "Point",
        coordinates: mockLocations.newYork.coordinates,
      },
    });

    anotherDriver = await createTestDriver(anotherDriverUser._id, {
      currentLocation: {
        type: "Point",
        coordinates: mockLocations.brooklyn.coordinates,
      },
    });

    // Generate tokens
    riderToken = generateTestToken(rider._id);
    driverToken = generateTestToken(driverUser._id);
    anotherDriverToken = generateTestToken(anotherDriverUser._id);
  });

  it("should complete full ride flow successfully", async () => {
    // Step 1: Rider requests a ride
    const rideRequest = {
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
    };

    const requestResponse = await request(app)
      .post("/api/rides/request")
      .set("Authorization", `Bearer ${riderToken}`)
      .send(rideRequest);

    expect(requestResponse.status).toBe(201);
    const rideId = requestResponse.body.data.ride._id;

    // Step 2: Driver accepts the ride
    const acceptResponse = await request(app)
      .post(`/api/rides/${rideId}/accept`)
      .set("Authorization", `Bearer ${driverToken}`);

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data.status).toBe("accepted");

    // Step 3: Driver updates status to arrived
    const arrivedResponse = await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ status: "driver_arrived" });

    expect(arrivedResponse.status).toBe(200);
    expect(arrivedResponse.body.data.status).toBe("driver_arrived");

    // Step 4: Driver starts the ride
    const startResponse = await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ status: "in_progress" });

    expect(startResponse.status).toBe(200);
    expect(startResponse.body.data.status).toBe("in_progress");

    // Step 5: Driver completes the ride
    const completeResponse = await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ status: "completed" });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.status).toBe("completed");
    expect(completeResponse.body.data.completedAt).toBeDefined();
    expect(completeResponse.body.data.actualPrice).toBeDefined();

    // Step 6: Get ride history for rider
    const historyResponse = await request(app)
      .get("/api/rides/history")
      .set("Authorization", `Bearer ${riderToken}`);

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.data.rides).toHaveLength(1);
    expect(historyResponse.body.data.rides[0]._id).toBe(rideId);
    expect(historyResponse.body.data.rides[0].status).toBe("completed");
  });

  it("should handle ride rejection and find alternative driver", async () => {
    // Step 1: Rider requests a ride
    const rideRequest = {
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
    };

    const requestResponse = await request(app)
      .post("/api/rides/request")
      .set("Authorization", `Bearer ${riderToken}`)
      .send(rideRequest);

    expect(requestResponse.status).toBe(201);
    const rideId = requestResponse.body.data.ride._id;

    // Step 2: First driver rejects the ride
    const rejectResponse = await request(app)
      .post(`/api/rides/${rideId}/reject`)
      .set("Authorization", `Bearer ${driverToken}`);

    expect(rejectResponse.status).toBe(200);

    // Step 3: Second driver accepts the ride
    const acceptResponse = await request(app)
      .post(`/api/rides/${rideId}/accept`)
      .set("Authorization", `Bearer ${anotherDriverToken}`);

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data.status).toBe("accepted");
    expect(acceptResponse.body.data.driverId).toBe(
      anotherDriverUser._id.toString()
    );
  });

  it("should handle ride cancellation by rider", async () => {
    // Step 1: Rider requests a ride
    const rideRequest = {
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
    };

    const requestResponse = await request(app)
      .post("/api/rides/request")
      .set("Authorization", `Bearer ${riderToken}`)
      .send(rideRequest);

    expect(requestResponse.status).toBe(201);
    const rideId = requestResponse.body.data.ride._id;

    // Step 2: Rider cancels the ride
    const cancelResponse = await request(app)
      .delete(`/api/rides/${rideId}/cancel`)
      .set("Authorization", `Bearer ${riderToken}`)
      .send({ reason: "Change of plans" });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.data.status).toBe("cancelled");
    expect(cancelResponse.body.data.cancelledBy).toBe(rider._id.toString());
  });
});
