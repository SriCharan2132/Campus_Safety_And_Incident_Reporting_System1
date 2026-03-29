// src/api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8081/api",
  // DO NOT set global Content-Type here
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
      if (error.response.status === 403) {
        alert("Access denied");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;