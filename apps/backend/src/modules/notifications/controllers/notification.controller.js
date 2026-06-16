import { notificationService } from '../services/notification.service.js';
import { successResponse } from '../../../shared/responses/apiResponse.js';

export const notificationController = {
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await notificationService.getNotifications(req.user.id, page, limit);
      return successResponse(res, 'Notifications retrieved', result);
    } catch (error) {
      next(error);
    }
  },

  async unreadCount(req, res, next) {
    try {
      const result = await notificationService.getUnreadCount(req.user.id);
      return successResponse(res, 'Unread count retrieved', result);
    } catch (error) {
      next(error);
    }
  },

  async markRead(req, res, next) {
    try {
      const result = await notificationService.markRead(req.params.id, req.user.id);
      return successResponse(res, 'Notification marked as read', result);
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req, res, next) {
    try {
      const result = await notificationService.markAllRead(req.user.id);
      return successResponse(res, 'All notifications marked as read', result);
    } catch (error) {
      next(error);
    }
  }
};
