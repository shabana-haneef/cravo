import { notificationRepository } from '../repositories/notification.repository.js';
import { getIO } from '../../../lib/socket.js';
import { logger } from '../../../shared/services/logger.js';

export const notificationService = {
  /**
   * Creates a notification in the DB and emits it via Socket.io to the user's room.
   * Fire-and-forget safe — caller should not await if non-critical.
   */
  async createAndEmit(userId, type, title, message, metadata = null) {
    try {
      const notification = await notificationRepository.create({
        userId,
        type,
        title,
        message,
        metadata
      });

      // Emit to user's private room
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
      }

      return notification;
    } catch (error) {
      // Swallow notification errors so they don't break the main flow
      logger.error({ err: error.message, userId, type }, 'Failed to create/emit notification');
    }
  },

  async getNotifications(userId, page, limit) {
    return notificationRepository.findByUserId(userId, page, limit);
  },

  async getUnreadCount(userId) {
    const count = await notificationRepository.countUnread(userId);
    return { count };
  },

  async markRead(id, userId) {
    await notificationRepository.markAsRead(id, userId);
    return { success: true };
  },

  async markAllRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { success: true };
  }
};
