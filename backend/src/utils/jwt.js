const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
// This code provides utility functions for generating and verifying JSON Web Tokens (JWT) in a Node.js application.
// It uses the `jsonwebtoken` library to create and verify tokens, which are commonly used for
// authentication and authorization purposes. The `generateToken` function creates a token with a specified payload and expiration time,
