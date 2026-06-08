import { api } from '../../../lib/axios.js';

export const cartApi = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addItem: async (data) => {
    // map variantId to productVariantId for backend compatibility
    const payload = {
      productVariantId: data.variantId || data.productVariantId,
      quantity: data.quantity
    };
    const response = await api.post('/cart/items', payload);
    return response.data;
  },

  updateItemQuantity: async (itemId, quantity) => {
    const response = await api.patch(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  }
};
