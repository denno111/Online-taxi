# RideShare API Testing Suite

## Overview

This testing suite provides comprehensive coverage for the RideShare API backend, including unit tests, integration tests, performance tests, and end-to-end scenarios.

## Test Structure

```
tests/
├── setup.js                 # Test environment setup
├── helpers/
│   └── testHelpers.js       # Common test utilities
├── controllers/             # API endpoint tests
├── services/               # Business logic tests
├── middleware/             # Middleware tests
├── integration/            # Full flow tests
├── performance/            # Load and performance tests
├── socket/                 # WebSocket tests
└── jest.config.js          # Jest configuration
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Suites

```bash
# Unit tests only
npm test -- --testPathPattern="tests/(services|middleware)"

# Integration tests only
npm test -- --testPathPattern="tests/(controllers|integration)"

# Performance tests only
npm test -- --testPathPattern="tests/performance"

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Using Test Script

```bash
# Run specific suite
./scripts/test.sh unit
./scripts/test.sh integration
./scripts/test.sh performance

# Run all tests
./scripts/test.sh all
```

## Test Coverage Goals

- **Lines**: 85%+
- **Functions**: 90%+
- **Branches**: 80%+
- **Statements**: 85%+

## Key Testing Scenarios

### 1. Ride Request Flow

- Ride creation and validation
- Driver matching algorithm
- Real-time notifications
- Status transitions

### 2. User Authentication

- Registration and login
- JWT token validation
- Password security
- Email verification

### 3. Location Tracking

- GPS coordinate validation
- Real-time location updates
- Geospatial queries
- Driver availability

### 4. Payment Processing

- Price calculations
- Payment method validation
- Transaction handling
- Refund processing

### 5. Error Handling

- Input validation
- Database errors
- Network failures
- Rate limiting

## Performance Benchmarks

### Response Time Targets

- Authentication: < 200ms
- Ride requests: < 500ms
- Location updates: < 100ms
- Driver searches: < 300ms

### Throughput Targets

- 100+ concurrent users
- 1000+ requests per minute
- 50+ location updates per second

## Writing New Tests

### Test File Structure

```javascript
describe("Feature Name", () => {
  let testData;

  beforeEach(async () => {
    // Setup test data
    testData = await createTestData();
  });

  describe("Specific functionality", () => {
    it("should handle success case", async () => {
      // Test implementation
    });

    it("should handle error case", async () => {
      // Test implementation
    });
  });
});
```

### Best Practices

1. Use descriptive test names
2. Test both success and failure cases
3. Clean up test data after each test
4. Use appropriate assertions
5. Mock external dependencies
6. Test edge cases and boundaries

## Continuous Integration

Tests run automatically on:

- Pull requests
- Merges to main/develop
- Nightly builds

### CI Pipeline

1. Code linting
2. Unit tests
3. Integration tests
4. Performance tests
5. Coverage analysis
6. Security scanning

## Troubleshooting

### Common Issues

#### MongoDB Connection

```bash
# Start MongoDB locally
mongod --dbpath /tmp/mongodb-test

# Or use Docker
docker run -d -p 27017:27017 mongo:5.0
```

#### Test Timeouts

```javascript
// Increase timeout for slow tests
jest.setTimeout(30000);
```

#### Memory Issues

```bash
# Increase Node.js memory
node --max-old-space-size=4096 ./node_modules/.bin/jest
```

### Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/controllers/rideController.test.js

# Debug with Node inspector
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Contributing

1. Write tests for new features
2. Maintain test coverage above 85%
3. Update documentation for new test patterns
4. Review test performance impact
5. Follow naming conventions

```

This completes the comprehensive testing suite for Sprint 2. The test suite covers:

1. **Complete test setup** with MongoDB memory server
2. **Unit tests** for all core functionality
3. **Integration tests** for full API workflows
4. **Performance tests** for load handling
5. **Socket.IO tests** for real-time features
6. **Error handling** and edge cases
7. **CI/CD integration** for automated testing
8. **Documentation** for maintenance

The testing suite ensures high code quality, catches regressions early, and provides confidence in the API's reliability and performance.
```
