import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const API_TOKEN = process.env.REACT_APP_API_TOKEN || "your-api-token";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - check your API token");
    } else if (error.response?.status === 500) {
      console.error("Server error - the backend might be down");
    } else if (error.code === "ECONNABORTED") {
      console.error(
        "Request timeout - the server is taking too long to respond"
      );
    }
    return Promise.reject(error);
  }
);

export const chatApi = {
  sendMessage: async (query, customerId, context = {}) => {
    try {
      const response = await apiClient.post("/chat", {
        query,
        customer_id: customerId,
        context,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Chat API error: ${error.message}`);
    }
  },

  getAvailableEquipment: async () => {
    try {
      const response = await apiClient.get("/equipment/available");
      return response.data;
    } catch (error) {
      throw new Error(`Equipment API error: ${error.message}`);
    }
  },

  bookEquipment: async (bookingData) => {
    try {
      const response = await apiClient.post("/equipment/book", bookingData);
      return response.data;
    } catch (error) {
      throw new Error(`Booking API error: ${error.message}`);
    }
  },

  healthCheck: async () => {
    try {
      const response = await apiClient.get("/health");
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  },
};
