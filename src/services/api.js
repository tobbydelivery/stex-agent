import axios from "axios";

const API = axios.create({
  baseURL: "https://tobby-delivery-backend.onrender.com/api",
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("agentToken");
      localStorage.removeItem("agentUser");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;