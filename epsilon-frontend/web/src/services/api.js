import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = useAuthStore.getState();
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        useAuthStore.setState({ accessToken: data.access });
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/connexion";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
