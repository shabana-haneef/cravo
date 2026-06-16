import { Server } from 'socket.io';
import { verifyToken } from '../shared/utils/jwt.js';
import { env } from '../config/env.js';
import { logger } from '../shared/services/logger.js';

let io = null;

/**
 * Parses a raw cookie string and returns a key/value map.
 */
const parseCookies = (cookieHeader = '') => {
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...v] = c.trim().split('=');
      return [key, decodeURIComponent(v.join('='))];
    })
  );
};

/**
 * Initializes the Socket.io server and attaches it to the HTTP server.
 * Each authenticated user joins a private room: `user:<userId>`.
 *
 * Auth two-tier fallback:
 *   1. Access token from handshake.auth.token  (present right after login)
 *   2. refreshToken httpOnly cookie            (always present while session active — survives page refresh)
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    },
    transports: ['polling', 'websocket']
  });

  io.use((socket, next) => {
    try {
      // Tier 1: in-memory access token sent by client after login
      const accessToken = socket.handshake.auth?.token;
      if (accessToken) {
        const decoded = verifyToken(accessToken, env.JWT_ACCESS_SECRET);
        socket.userId = decoded.id;
        return next();
      }

      // Tier 2: httpOnly refreshToken cookie — survives page refreshes
      const cookies = parseCookies(socket.handshake.headers?.cookie || '');
      const refreshToken = cookies.refreshToken;
      if (refreshToken) {
        const decoded = verifyToken(refreshToken, env.JWT_REFRESH_SECRET);
        socket.userId = decoded.id;
        return next();
      }

      return next(new Error('Authentication token missing'));
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Join user's private room for targeted delivery
    socket.join(`user:${userId}`);
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    socket.on('disconnect', (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

/**
 * Returns the initialized Socket.io instance.
 * Returns null if not yet initialized (safe to call anywhere).
 */
export const getIO = () => io;
