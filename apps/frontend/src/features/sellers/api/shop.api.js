import { api } from '../../../lib/axios.js';

export const shopApi = {
  getMyShop: async () => {
    const response = await api.get('/shops/me');
    return response.data;
  },
  updateShop: async (formData) => {
    const response = await api.put('/shops/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
