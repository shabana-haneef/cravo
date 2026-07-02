import { api } from '../../../lib/axios.js';

export const sellerOrderApi = {
  getSellerOrders: async (page = 1, limit = 20) => {
    const response = await api.get('/orders/seller/orders', { params: { page, limit } });
    return response.data;
  },

  updateOrderStatus: async ({ orderId, status }) => {
    const response = await api.patch(`/orders/seller/orders/${orderId}/status`, { status });
    return response.data;
  },

  createShipment: async (orderId) => {
    const response = await api.post(`/delhivery/create-shipment/${orderId}`);
    return response.data;
  },
};
