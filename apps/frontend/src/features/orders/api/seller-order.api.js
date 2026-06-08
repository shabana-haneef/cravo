import { api } from '../../../lib/axios.js';

export const sellerOrderApi = {
  getSellerOrders: async () => {
    const response = await api.get('/orders/seller/orders');
    return response.data;
  },

  updateOrderStatus: async ({ orderId, status }) => {
    const response = await api.patch(`/orders/seller/orders/${orderId}/status`, { status });
    return response.data;
  },
};
