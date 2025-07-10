const socketIo = require("socket.io");
const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const Driver = require("../models/Driver");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://yourdomain.com"]
          : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.user.firstName} ${socket.user.lastName}`
    );

    // Join user-specific room
    socket.join(`user_${socket.user._id}`);

    // Join role-specific room
    socket.join(`${socket.user.userType}_${socket.user._id}`);

    // Handle driver going online/offline
    socket.on("driver_status", async (data) => {
      if (socket.user.userType === "driver") {
        await Driver.findOneAndUpdate(
          { userId: socket.user._id },
          {
            isOnline: data.isOnline,
            isAvailable: data.isOnline ? data.isAvailable : false,
            lastLocationUpdate: new Date(),
          }
        );

        socket.emit("driver_status_updated", {
          isOnline: data.isOnline,
          isAvailable: data.isOnline ? data.isAvailable : false,
        });
      }
    });

    // Handle location updates
    socket.on("location_update", async (data) => {
      if (socket.user.userType === "driver") {
        await Driver.findOneAndUpdate(
          { userId: socket.user._id },
          {
            currentLocation: {
              type: "Point",
              coordinates: [data.longitude, data.latitude],
            },
            lastLocationUpdate: new Date(),
          }
        );

        // If driver is on a ride, emit location to rider
        const driver = await Driver.findOne({ userId: socket.user._id });
        if (driver.currentRideId) {
          socket.to(`ride_${driver.currentRideId}`).emit("driver_location", {
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading,
            timestamp: new Date(),
          });
        }
      }
    });

    // Handle ride request response
    socket.on("ride_response", async (data) => {
      if (socket.user.userType === "driver") {
        const { rideId, response } = data; // response: 'accept' or 'decline'

        io.emit("ride_response_received", {
          rideId,
          driverId: socket.user._id,
          response,
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(
        `User disconnected: ${socket.user.firstName} ${socket.user.lastName}`
      );

      // If driver disconnects, mark as offline
      if (socket.user.userType === "driver") {
        await Driver.findOneAndUpdate(
          { userId: socket.user._id },
          {
            isOnline: false,
            isAvailable: false,
            lastLocationUpdate: new Date(),
          }
        );
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

module.exports = { initializeSocket, getIO };
