import { api } from '../../../lib/axios.js';

export const productApi = {
  getProducts: async (params) => {
    // Clean up empty params
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== '')
    );
    const response = await api.get('/products', { params: cleanParams });
    return response.data;
  },

  getProductBySlug: async (slug) => {
    const response = await api.get(`/products/${slug}`);
    return response.data;
  }
};
