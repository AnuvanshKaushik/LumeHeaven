import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://lumeheaven.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lumeheaven_token") || localStorage.getItem("loomsheven_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
