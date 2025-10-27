import axios from "axios";
import { getToken, clearAuth } from "../utils/storage";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout on 401 error
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Activity Logs API
export const getActivityLogs = (params) =>
  api.get("/activity-logs", { params });
export const getActivityLog = (id) => api.get(`/activity-logs/${id}`);
export const getActions = () => api.get("/activity-logs/actions/list");
export const getModelTypes = () => api.get("/activity-logs/model-types/list");
export const getUsers = () => api.get("/users");

export default api;
