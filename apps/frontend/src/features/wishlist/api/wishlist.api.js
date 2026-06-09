import { api } from '../../../lib/axios.js';

export const wishlistApi = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  toggleWishlist: async (productId) => {
    const response = await api.post('/wishlist/toggle', { productId });
    return response.data;
  },

  checkStatus: async (productId) => {
    const response = await api.get(`/wishlist/status/${productId}`);
    return response.data;
  }
};
