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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
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

// Response Interceptor: Handle 401 & Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401, not a retry attempt, and not the login/refresh endpoint itself
    const isAuthRoute = originalRequest.url && (originalRequest.url.endsWith('/auth/refresh-token') || originalRequest.url.endsWith('/auth/login'));
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      let newToken = null;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        newToken = data.data.accessToken;

        // Update zustand store
        useAuthStore.getState().setAuth(useAuthStore.getState().user, newToken);

        // Process queue
        processQueue(null, newToken);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().clearAuth(); // Force logout
        if (window.location.pathname !== '/login' && originalRequest.url !== '/auth/me') {
          window.location.href = '/login'; // Redirect to login page
        }
        isRefreshing = false;
        return Promise.reject(err);
      }
      
      isRefreshing = false;
      // Retry original request outside of try-catch so its errors don't trigger logout
      originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
