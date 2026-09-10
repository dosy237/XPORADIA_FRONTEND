import axios from "axios";

import { syncServerClock } from "@/lib/serverClock";
import { useAuthStore } from "@/store/authStore";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Plusieurs requêtes peuvent échouer en 401 au même instant (ex. fil +
// notifications au démarrage). Sans coordination, chacune déclencherait
// son propre appel de rafraîchissement en parallèle — or le refresh token
// tourne à chaque utilisation côté serveur (ROTATE_REFRESH_TOKENS), donc
// des rafraîchissements concurrents avec le MÊME refresh token de départ
// finissaient par laisser le client bloqué : un seul rafraîchissement en
// vol à la fois, partagé par toutes les requêtes qui l'attendent.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/token/refresh/`, {
        refresh: useAuthStore.getState().refreshToken,
      })
      .then(({ data }) => {
        useAuthStore.getState().setTokens(data.access, data.refresh);
        return data.access as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => {
    syncServerClock(response.headers?.date);
    return response;
  },
  async (error) => {
    syncServerClock(error.response?.headers?.date);
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const access = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
