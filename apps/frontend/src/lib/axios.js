import axios from 'axios';
import { useAuthStore } from '../store/auth.store.js';

// Base instance
// In production (Vercel), VITE_API_URL points to the Render backend.
// In local dev, Vite proxy handles /api so we fall back to '/api/v1'.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // For httpOnly cookies like refreshToken
});

// Singleton in-flight refresh promise shared across all parallel 401s
let refreshPromise = null;

const getFreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        await useAuthStore.getState().restoreAuth(api, true);
        const token = useAuthStore.getState().accessToken;
        return token;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamless Auto-Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Reject immediately if no config or if it's not a 401
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never intercept the refresh or login endpoints themselves
    const url = originalRequest.url || '';
    if (url.includes('/auth/refresh-token') || url.includes('/auth/login') || url.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    // Prevent infinite loops by checking the retry marker
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      const newToken = await getFreshToken();
      if (!newToken) {
        return Promise.reject(error);
      }

      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      return Promise.reject(refreshErr);
    }
  }
);

