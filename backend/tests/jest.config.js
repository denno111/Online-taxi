module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testTimeout: 30000,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
    "!src/utils/logger.js",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
  verbose: true,
  testSequencer: "<rootDir>/tests/testSequencer.js",
};
