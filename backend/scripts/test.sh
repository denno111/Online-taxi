#!/bin/bash

# Test runner script with different test suites

echo "🧪 Running RideShare API Test Suite"
echo "=================================="

# Set test environment
export NODE_ENV=test
export JWT_SECRET=test-secret-key
export MONGODB_URI=mongodb://localhost:27017/rideshare-test

# Function to run specific test suite
run_test_suite() {
  local suite=$1
  local description=$2
  
  echo ""
  echo "📋 Running $description..."
  echo "----------------------------------------"
  
  if npm test -- --testPathPattern="$suite" --verbose; then
    echo "✅ $description passed"
  else
    echo "❌ $description failed"
    exit 1
  fi
}

# Parse command line arguments
case $1 in
  "unit")
    run_test_suite "tests/(services|middleware|utils)" "Unit Tests"
    ;;
  "integration")
    run_test_suite "tests/(controllers|integration)" "Integration Tests"
    ;;
  "performance")
    run_test_suite "tests/performance" "Performance Tests"
    ;;
  "coverage")
    echo "📊 Running tests with coverage..."
    npm run test:coverage
    ;;
  "watch")
    echo "👀 Running tests in watch mode..."
    npm run test:watch
    ;;
  "all" | "")
    # Run all test suites in order
    run_test_suite "tests/middleware" "Middleware Tests"
    run_test_suite "tests/services" "Service Tests"
    run_test_suite "tests/controllers" "Controller Tests"
    run_test_suite "tests/integration" "Integration Tests"
    run_test_suite "tests/socket" "Socket Tests"
    
    echo ""
    echo "🎉 All tests completed successfully!"
    echo "📊 Generating coverage report..."
    npm run test:coverage
    ;;
  *)
    echo "Usage: $0 [unit|integration|performance|coverage|watch|all]"
    echo ""
    echo "Available test suites:"
    echo "  unit         - Run unit tests only"
    echo "  integration  - Run integration tests only"
    echo "  performance  - Run performance tests only"
    echo "  coverage     - Run all tests with coverage"
    echo "  watch        - Run tests in watch mode"
    echo "  all          - Run all test suites (default)"
    exit 1
    ;;
esac