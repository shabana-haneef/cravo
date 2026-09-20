import { api } from '../../../lib/axios.js';

export const trackingApi = {
  getPublicTracking: async (identifier) => {
    const response = await api.get(`/deliveries/track/${encodeURIComponent(identifier)}`);
    return response.data;
  }
};
