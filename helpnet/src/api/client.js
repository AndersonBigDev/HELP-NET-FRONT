import axios from "axios";

const TOKEN_KEY = "helpnet.token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Formato de erro do backend: StandardError { timestamp, status, error, path }
    const message =
      error.response?.data?.error ||
      error.message ||
      "Não foi possível completar a requisição.";

    if (error.response?.status === 401) {
      tokenStorage.clear();
    }

    return Promise.reject(new Error(message));
  },
);
