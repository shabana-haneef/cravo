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

  updateShipment: async ({ id, updates }) => {
    const response = await api.patch(`/deliveries/${id}/shipment`, updates);
    return response.data;
  },

  cancelShipment: async ({ id, reason }) => {
    const response = await api.post(`/deliveries/${id}/cancel`, { reason });
    return response.data;
  },

  cancelPickup: async ({ id, reason }) => {
    const response = await api.post(`/deliveries/${id}/pickup/cancel`, { reason });
    return response.data;
  },

  reschedulePickup: async ({ id, pickupDate, pickupTime }) => {
    const response = await api.post(`/deliveries/${id}/pickup/reschedule`, { pickupDate, pickupTime });
    return response.data;
  },

  updateEwaybill: async ({ id, dcn, ewbn }) => {
    const response = await api.put(`/deliveries/${id}/ewaybill`, { dcn, ewbn });
    return response.data;
  },
};
