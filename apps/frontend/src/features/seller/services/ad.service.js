import { api } from '../../../lib/axios.js';

export const adSellerService = {
  async getPackages() {
    return api.get('/sellers/ads/packages');
  },
  async createAdOrder(data) {
    return api.post('/sellers/ads/order', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  async verifyPayment(data) {
    return api.post('/sellers/ads/verify', data);
  },
  async getMyAds() {
    return api.get('/sellers/ads');
  }
};
