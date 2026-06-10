import { api } from '../../../lib/axios.js';

export const notificationApi = {
  async list(page = 1, limit = 20) {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  async unreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  async markRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};
