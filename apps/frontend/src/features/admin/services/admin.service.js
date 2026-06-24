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
  },

  // Product Verification
  async listProducts(status = 'PENDING_APPROVAL') {
    const response = await api.get(`/admin/products/pending?status=${status}`);
    return response.data;
  },

  async approveProduct(id) {
    const response = await api.patch(`/admin/products/${id}/approve`);
    return response.data;
  },

  async rejectProduct(id, reason) {
    const response = await api.patch(`/admin/products/${id}/reject`, { reason });
    return response.data;
  },

  // Quick Actions & Diagnostics
  async clearCache() {
    const response = await api.post('/admin/quick-actions/clear-cache');
    return response.data;
  },

  async triggerBackup() {
    const response = await api.post('/admin/quick-actions/backup');
    return response.data;
  },

  async getBackups() {
    const response = await api.get('/admin/quick-actions/backups');
    return response.data;
  },

  async downloadBackup(fileName) {
    const response = await api.get(`/admin/quick-actions/backups/${fileName}/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getHealth() {
    const response = await api.get('/admin/quick-actions/health');
    return response.data;
  },

  async getAuditLogs(params) {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  async getAuditStats() {
    const response = await api.get('/admin/audit-logs/stats');
    return response.data;
  },

  async exportAuditLogs(format, params = {}) {
    const response = await api.get('/admin/audit-logs/export', {
      params: { ...params, format },
      responseType: 'blob'
    });
    const fileExtension = format.toLowerCase() === 'csv' ? 'csv' : 'json';
    const contentType = format.toLowerCase() === 'csv' ? 'text/csv' : 'application/json';
    const fileName = `audit-logs-${Date.now()}.${fileExtension}`;
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async testConnection(service, data = {}) {
    const response = await api.post(`/admin/integrations/${service}/test`, data);
    return response.data;
  },

  async getIntegrationLogs(service) {
    const params = service ? { service } : {};
    const response = await api.get('/admin/integrations/logs', { params });
    return response.data;
  },

  async getOrderSettings() {
    const response = await api.get('/admin/settings/orders');
    return response.data;
  },

  async updateOrderSettings(data) {
    const response = await api.put('/admin/settings/orders', data);
    return response.data;
  },

  async getDeliverySettings() {
    const response = await api.get('/admin/settings/delivery');
    return response.data;
  },

  async updateDeliverySettings(data) {
    const response = await api.put('/admin/settings/delivery', data);
    return response.data;
  },

  async getDeliveryAnalytics() {
    const response = await api.get('/admin/settings/delivery/analytics');
    return response.data;
  },

  async getDelhiveryIntegrationInfo() {
    const response = await api.get('/admin/settings/delivery/integration-info');
    return response.data;
  },

  async getGovernanceSettings() {
    const response = await api.get('/admin/settings/governance');
    return response.data;
  },

  async updateGovernanceSettings(data) {
    const response = await api.put('/admin/settings/governance', data);
    return response.data;
  },

  async getMarketplaceHealth() {
    const response = await api.get('/admin/settings/governance/health');
    return response.data;
  },

  async getPaymentSettings() {
    const response = await api.get('/admin/settings/payment');
    return response.data;
  },

  async updatePaymentSettings(data) {
    const response = await api.put('/admin/settings/payment', data);
    return response.data;
  },

  async getPaymentHealth() {
    const response = await api.get('/admin/settings/payment/health');
    return response.data;
  },

  async getInventorySettings() {
    const response = await api.get('/admin/settings/inventory');
    return response.data;
  },

  async updateInventorySettings(data) {
    const response = await api.put('/admin/settings/inventory', data);
    return response.data;
  },

  async getInventoryHealth() {
    const response = await api.get('/admin/settings/inventory/health');
    return response.data;
  }
};

