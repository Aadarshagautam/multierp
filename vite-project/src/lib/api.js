import axios from "axios";
import {
  createClientRequestId,
  getClientSessionId,
  reportBrowserEvent,
} from "./monitoring.js";

const api = axios.create({
  baseURL: `${import.meta.env?.VITE_BACKEND_URL || "http://localhost:5001"}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["X-Client-Session-Id"] = getClientSessionId();
  config.headers["X-Request-Id"] = createClientRequestId();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response || error.response.status >= 500) {
      await reportBrowserEvent({
        level: "error",
        message: "API request failed",
        metadata: {
          method: error.config?.method || null,
          url: error.config?.url || null,
          statusCode: error.response?.status || null,
        },
      });
    }

    return Promise.reject(error);
  }
);

export default api;
