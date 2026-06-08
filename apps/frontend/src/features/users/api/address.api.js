import { api } from '../../../lib/axios.js';

export const addressApi = {
  getAddresses: async () => {
    const response = await api.get('/users/addresses');
    return response.data;
  },

  createAddress: async (data) => {
    const response = await api.post('/users/addresses', data);
    return response.data;
  },

  updateAddress: async (id, data) => {
    const response = await api.put(`/users/addresses/${id}`, data);
    return response.data;
  },

  deleteAddress: async (id) => {
    const response = await api.delete(`/users/addresses/${id}`);

    return response.data;
  }
};
