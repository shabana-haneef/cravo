import { api } from '../../../lib/axios.js';

export const getMyProducts = async (page = 1, limit = 10) => {
  const { data } = await api.get('/products/me/all', { params: { page, limit } });
  return data;
};

export const getMyProductById = async (id) => {
  const { data } = await api.get(`/products/me/${id}`);
  return data;
};

export const createProduct = async (formData) => {
  const { data } = await api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateProduct = async ({ id, formData }) => {
  const { data } = await api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

export const addVariant = async ({ productId, payload }) => {
  const { data } = await api.post(`/products/${productId}/variants`, payload);
  return data;
};

export const updateVariant = async ({ productId, variantId, payload }) => {
  const { data } = await api.put(`/products/${productId}/variants/${variantId}`, payload);
  return data;
};

export const deleteVariant = async ({ productId, variantId }) => {
  const { data } = await api.delete(`/products/${productId}/variants/${variantId}`);
  return data;
};
