require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/database");
const { initializeSocket } = require("./config/socket");

const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
