import { api } from '../../../lib/axios.js';

export const categoryApi = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};
