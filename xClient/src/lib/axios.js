import axios from "axios";
import useAuthStore from "../features/auth/store/auth.store.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const getAccessTokenFromHeader = (headers) => {
  const authHeader = headers?.["authorization"];

  return authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
};

const isPublicAuthRoute = (url = "") => {
  return (
    url.includes("/login") ||
    url.includes("/register") ||
    url.includes("/verify-otp") ||
    url.includes("/resend-otp") ||
    url.includes("/forgot-password") ||
    url.includes("/reset-password") ||
    url.includes("/regenerate-token")
  );
};

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && !isPublicAuthRoute(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
    
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const shouldRegenerateToken =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRoute(originalRequest.url);

    if (!shouldRegenerateToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await api.post("/regenerate-token");
      const newAccessToken =
      getAccessTokenFromHeader(refreshResponse.headers) ||
      refreshResponse.data?.data?.accessToken;
      if (!newAccessToken) {
        throw new Error("No access token returned");
      }

      useAuthStore.getState().setAccessToken(newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (err) {
      useAuthStore.getState().logout();
      return Promise.reject(err);
    }
  }
);

export default api;