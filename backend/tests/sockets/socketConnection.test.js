const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { initializeSocket } = require("../../src/config/socket");
const { createTestUser, generateTestToken } = require("../helpers/testHelpers");

describe("Socket.IO Connection", () => {
  let io, serverSocket, clientSocket, server, user, token;

  beforeEach(async () => {
    // Create test user
    user = await createTestUser("driver");
    token = generateTestToken(user._id);

    // Create HTTP server and Socket.IO instance
    server = createServer();
    io = initializeSocket(server);

    // Start server
    await new Promise((resolve) => {
      server.listen(0, resolve);
    });

    const port = server.address().port;

    // Create client socket
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token },
    });

    // Wait for connection
    await new Promise((resolve) => {
      clientSocket.on("connect", resolve);
    });

    // Get server socket
    serverSocket = io.sockets.sockets.get(clientSocket.id);
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
    }
    if (server) {
      server.close();
    }
  });

  describe("Authentication", () => {
    it("should authenticate with valid token", () => {
      expect(clientSocket.connected).toBe(true);
      expect(serverSocket.user).toBeDefined();
      expect(serverSocket.user._id.toString()).toBe(user._id.toString());
    });

    it("should reject connection with invalid token", async () => {
      const invalidClient = Client(
        `http://localhost:${server.address().port}`,
        {
          auth: { token: "invalid-token" },
        }
      );

      await new Promise((resolve) => {
        invalidClient.on("connect_error", (error) => {
          expect(error.message).toContain("Authentication error");
          resolve();
        });
      });

      invalidClient.close();
    });
  });

  describe("Driver Status Updates", () => {
    it("should handle driver going online", (done) => {
      clientSocket.emit("driver_status", { isOnline: true, isAvailable: true });

      clientSocket.on("driver_status_updated", (data) => {
        expect(data.isOnline).toBe(true);
        expect(data.isAvailable).toBe(true);
        done();
      });
    });

    it("should handle driver going offline", (done) => {
      clientSocket.emit("driver_status", {
        isOnline: false,
        isAvailable: false,
      });

      clientSocket.on("driver_status_updated", (data) => {
        expect(data.isOnline).toBe(false);
        expect(data.isAvailable).toBe(false);
        done();
      });
    });
  });

  describe("Location Updates", () => {
    it("should handle location updates", (done) => {
      const locationData = {
        latitude: 40.7128,
        longitude: -74.006,
        heading: 90,
      };

      clientSocket.emit("location_update", locationData);

      // Check if location was updated (you'd need to verify in database)
      setTimeout(() => {
        // In a real test, you'd verify the driver's location was updated in the database
        done();
      }, 100);
    });
  });

  describe("Ride Responses", () => {
    it("should handle ride acceptance", (done) => {
      const rideResponse = {
        rideId: "507f1f77bcf86cd799439011",
        response: "accept",
      };

      clientSocket.emit("ride_response", rideResponse);

      // Listen for the response event
      io.on("ride_response_received", (data) => {
        expect(data.rideId).toBe(rideResponse.rideId);
        expect(data.response).toBe("accept");
        expect(data.driverId).toBe(user._id.toString());
        done();
      });
    });

    it("should handle ride rejection", (done) => {
      const rideResponse = {
        rideId: "507f1f77bcf86cd799439011",
        response: "decline",
      };

      clientSocket.emit("ride_response", rideResponse);

      io.on("ride_response_received", (data) => {
        expect(data.response).toBe("decline");
        done();
      });
    });
  });
});
