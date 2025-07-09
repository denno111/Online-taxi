const Sequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Run unit tests first, then integration tests, then performance tests
    const testOrder = [
      "unit",
      "controllers",
      "services",
      "middleware",
      "integration",
      "performance",
    ];

    return tests.sort((testA, testB) => {
      const getTestPriority = (test) => {
        for (let i = 0; i < testOrder.length; i++) {
          if (test.path.includes(testOrder[i])) {
            return i;
          }
        }
        return testOrder.length;
      };

      const priorityA = getTestPriority(testA);
      const priorityB = getTestPriority(testB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = CustomSequencer;
