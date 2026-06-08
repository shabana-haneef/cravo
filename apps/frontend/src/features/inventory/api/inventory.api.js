import { api } from '../../../lib/axios.js';

export const getInventoryItem = async (variantId) => {
  const { data } = await api.get(`/inventory/${variantId}`);
  return data;
};

export const adjustStock = async ({ variantId, payload }) => {
  // payload: { quantity: number, reason: string }
  const { data } = await api.patch(`/inventory/${variantId}`, payload);
  return data;
};

export const getInventoryHistory = async ({ variantId, page = 1, limit = 20 }) => {
  const { data } = await api.get(`/inventory/${variantId}/history`, {
    params: { page, limit }
  });
  return data;
};
