import api from "./api";

const rideService = {
  // Create ride request
  createRideRequest: async (rideData) => {
    const response = await api.post("/rides/request", rideData);
    return response.data;
  },

  // Accept ride request (driver)
  acceptRideRequest: async (rideId) => {
    const response = await api.post(`/rides/${rideId}/accept`);
    return response.data;
  },

  // Update ride status
  updateRideStatus: async (rideId, status) => {
    const response = await api.patch(`/rides/${rideId}/status`, { status });
    return response.data;
  },

  // Cancel ride
  cancelRide: async (rideId, reason) => {
    const response = await api.delete(`/rides/${rideId}/cancel`, {
      data: { reason },
    });
    return response.data;
  },

  // Get active ride
  getActiveRide: async () => {
    const response = await api.get("/rides/active");
    return response.data;
  },

  // Get ride details
  getRideDetails: async (rideId) => {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  },

  // Get ride history
  getRideHistory: async (page = 1, limit = 10, status = null) => {
    const params = { page, limit };
    if (status) params.status = status;

    const response = await api.get("/rides/history", { params });
    return response.data;
  },

  // Update location
  updateLocation: async (
    latitude,
    longitude,
    heading = null,
    speed = null,
    accuracy = null
  ) => {
    const response = await api.post("/location/update", {
      latitude,
      longitude,
      heading,
      speed,
      accuracy,
    });
    return response.data;
  },

  // Get nearby drivers
  getNearbyDrivers: async (latitude, longitude, radius = 5) => {
    const response = await api.get("/location/nearby-drivers", {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },

  // Get ride location history
  getRideLocationHistory: async (rideId) => {
    const response = await api.get(`/location/ride/${rideId}/history`);
    return response.data;
  },
};

export default rideService;
