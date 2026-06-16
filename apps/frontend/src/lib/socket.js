import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store.js';

let socket = null;

/**
 * Returns the existing connected socket or creates a new one.
 *
 * Auth strategy mirrors the backend two-tier fallback:
 *   1. Passes the access token in handshake.auth.token (present right after login)
 *   2. withCredentials: true ensures the httpOnly refreshToken cookie is sent automatically
 *      — this is the fallback the backend uses after a page refresh.
 */
export const getSocket = () => {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().accessToken;

  socket = io('/', {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    withCredentials: true,        // Send httpOnly cookies (refreshToken) with handshake
    auth: { token: token ?? '' }, // Send access token if available; backend falls back to cookie
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000
  });

  return socket;
};

/**
 * Disconnects and clears the socket instance.
 * Call this on logout.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
