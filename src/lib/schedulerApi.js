import axios from "axios";

const schedulerApi = axios.create({
  baseURL: import.meta.env.VITE_SCHEDULER_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

schedulerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("crm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default schedulerApi;
