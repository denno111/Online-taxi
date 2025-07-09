const {
  calculateRidePrice,
  calculateCancellationFee,
} = require("../../src/services/pricingService");
const { mockLocations } = require("../helpers/testHelpers");

describe("Pricing Service", () => {
  describe("calculateRidePrice", () => {
    it("should calculate standard ride price correctly", () => {
      const rideData = {
        pickupLocation: {
          coordinates: mockLocations.newYork.coordinates,
        },
        destinationLocation: {
          coordinates: mockLocations.brooklyn.coordinates,
        },
        rideType: "standard",
        distance: 10, // km
        duration: 20, // minutes
        timeOfDay: "normal",
      };

      const pricing = calculateRidePrice(rideData);

      expect(pricing.basePrice).toBeDefined();
      expect(pricing.distancePrice).toBeDefined();
      expect(pricing.timePrice).toBeDefined();
      expect(pricing.totalPrice).toBeDefined();
      expect(pricing.totalPrice).toBeGreaterThan(0);
      expect(pricing.estimatedEarnings).toBeDefined();
    });

    it("should apply surge pricing during peak hours", () => {
      const rideData = {
        pickupLocation: {
          coordinates: mockLocations.newYork.coordinates,
        },
        destinationLocation: {
          coordinates: mockLocations.brooklyn.coordinates,
        },
        rideType: "standard",
        distance: 10,
        duration: 20,
        timeOfDay: "peak",
      };

      const normalPricing = calculateRidePrice({
        ...rideData,
        timeOfDay: "normal",
      });

      const peakPricing = calculateRidePrice(rideData);

      expect(peakPricing.totalPrice).toBeGreaterThan(normalPricing.totalPrice);
      expect(peakPricing.surgeMultiplier).toBeGreaterThan(1);
    });

    it("should calculate premium ride price with higher rate", () => {
      const standardRide = {
        pickupLocation: {
          coordinates: mockLocations.newYork.coordinates,
        },
        destinationLocation: {
          coordinates: mockLocations.brooklyn.coordinates,
        },
        rideType: "standard",
        distance: 10,
        duration: 20,
        timeOfDay: "normal",
      };

      const premiumRide = {
        ...standardRide,
        rideType: "premium",
      };

      const standardPricing = calculateRidePrice(standardRide);
      const premiumPricing = calculateRidePrice(premiumRide);

      expect(premiumPricing.totalPrice).toBeGreaterThan(
        standardPricing.totalPrice
      );
    });

    it("should handle minimum fare correctly", () => {
      const shortRide = {
        pickupLocation: {
          coordinates: mockLocations.newYork.coordinates,
        },
        destinationLocation: {
          coordinates: [-74.0065, 40.713], // Very close location
        },
        rideType: "standard",
        distance: 0.5, // Very short distance
        duration: 2,
        timeOfDay: "normal",
      };

      const pricing = calculateRidePrice(shortRide);

      expect(pricing.totalPrice).toBeGreaterThanOrEqual(5.0); // Minimum fare
    });
  });

  describe("calculateCancellationFee", () => {
    it("should not charge fee for early cancellation", () => {
      const rideData = {
        status: "pending",
        createdAt: new Date(),
        acceptedAt: null,
      };

      const fee = calculateCancellationFee(rideData);

      expect(fee).toBe(0);
    });

    it("should charge fee for late cancellation after acceptance", () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const rideData = {
        status: "accepted",
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        acceptedAt: tenMinutesAgo,
        estimatedPrice: 20.0,
      };

      const fee = calculateCancellationFee(rideData);

      expect(fee).toBeGreaterThan(0);
      expect(fee).toBeLessThanOrEqual(10.0); // Maximum cancellation fee
    });

    it("should increase fee based on time after acceptance", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const recentCancellation = {
        status: "accepted",
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        acceptedAt: fiveMinutesAgo,
        estimatedPrice: 20.0,
      };

      const lateCancellation = {
        status: "accepted",
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
        acceptedAt: fifteenMinutesAgo,
        estimatedPrice: 20.0,
      };

      const recentFee = calculateCancellationFee(recentCancellation);
      const lateFee = calculateCancellationFee(lateCancellation);

      expect(lateFee).toBeGreaterThan(recentFee);
    });
  });
});
