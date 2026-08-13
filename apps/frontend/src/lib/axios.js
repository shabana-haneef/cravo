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

// Subscribe to store state changes to resolve queue from cross-tab events
useAuthStore.subscribe((state, prevState) => {
  if (prevState.authStatus === 'restoring') {
    if (state.authStatus === 'authenticated') {
      // Another tab successfully refreshed.
      // If this tab was also waiting in the queue, resolve it.
      if (isRefreshing) {
        isRefreshing = false;
        processQueue(null, state.accessToken);
      }
    } else if (state.authStatus === 'unauthenticated') {
      // Another tab failed to refresh.
      if (isRefreshing) {
        isRefreshing = false;
        processQueue(new Error('Cross-tab refresh failed'), null);
      }
    }
  }
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Reject immediately if no config or if it's not a 401
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never intercept the refresh or login endpoints themselves
    const isAuthRoute = originalRequest.url && (originalRequest.url.endsWith('/auth/refresh-token') || originalRequest.url.endsWith('/auth/login'));
    if (isAuthRoute) {
      return Promise.reject(error);
    }

    // Prevent infinite loops by checking the retry marker
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if a refresh is already happening (either in this tab or marked by another tab)
    if (isRefreshing || useAuthStore.getState().authStatus === 'restoring') {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Become the refresh owner for this tab
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // We delegate to restoreAuth in the store, forcing a network refresh
      await useAuthStore.getState().restoreAuth(api, true);

      const newToken = useAuthStore.getState().accessToken;
      
      // Retry the original request
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      
      // Resolve any other requests that queued up in this tab while we were refreshing
      processQueue(null, newToken);
      
      return api(originalRequest);
    } catch (err) {
      // Distinguish between a genuine refresh failure and a safe backend concurrency queue signal
      if (err.response?.status === 401 && err.response?.data?.message === 'Concurrent refresh detected') {
          // It's a concurrent request race condition on the backend.
          // Another tab beat us to the DB lock. Queue this request and wait for cross-tab sync.
          return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
          })
          .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return api(originalRequest);
          })
          .catch((queueErr) => Promise.reject(queueErr));
      }

      // Genuine refresh failure (revoked token, network failure during refresh, etc)
      // Only clear auth on a definitive 401/403 from the refresh endpoint.
      // Don't log out if it's a 5xx or Network Error.
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        processQueue(err, null);
        // The restoreAuth method inside auth.store.js already calls clearAuth(), so we just reject.
      } else {
         // Network error or 5xx, reject the queue but do not forcibly logout
         processQueue(err, null);
      }
      
      return Promise.reject(err);
    } finally {
      // Always reset the single-tab lock
      isRefreshing = false;
    }
  }
);
