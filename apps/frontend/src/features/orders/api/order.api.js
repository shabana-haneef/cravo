import { api } from '../../../lib/axios.js';

export const orderApi = {
  getPreview: async (params) => {
    const response = await api.get('/orders/checkout/preview', { params });
    return response.data;
  },

  createCheckoutOrder: async (data) => {
    // data: { addressId }
    const response = await api.post('/orders/checkout', data);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  }
};
