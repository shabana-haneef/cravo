import { api } from '../../../lib/axios.js';

export const adminService = {
  // Dashboard & Settings
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  async getSettings() {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  async updateSettings(data) {
    const response = await api.put('/admin/settings', data);
    return response.data;
  },

  // Advertisements (Admin)
  async getAdPackages() {
    return api.get('/admin/ads/packages');
  },
  async createAdPackage(data) {
    return api.post('/admin/ads/packages', data);
  },
  async getAds() {
    return api.get('/admin/ads');
  },
  async createAdminAd(data) {
    return api.post('/admin/ads/free', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  async approveAd(id) {
    return api.put(`/admin/ads/${id}/approve`);
  },
  async rejectAd(id, reason) {
    return api.put(`/admin/ads/${id}/reject`, { reason });
  },

  // User Management
  async listUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async updateUserRole(userId, role) {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  async updateUserStatus(userId, status) {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  // Seller Applications
  async listSellerApplications(status = '') {
    const url = status ? `/admin/seller-applications?status=${status}` : '/admin/seller-applications';
    const response = await api.get(url);
    return response.data;
  },

  async getSellerApplication(id) {
    const response = await api.get(`/admin/seller-applications/${id}`);
    return response.data;
  },

  async approveApplication(id) {
    const response = await api.patch(`/admin/seller-applications/${id}/approve`);
    return response.data;
  },

  async rejectApplication(id, reason) {
    const response = await api.patch(`/admin/seller-applications/${id}/reject`, { reason });
    return response.data;
  }
};
