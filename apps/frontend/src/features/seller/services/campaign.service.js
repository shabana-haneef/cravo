import { api } from '../../../lib/axios.js';

export const campaignService = {
  createCampaign: (data) => {
    return api.post('/campaigns', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  verifyPayment: (id, paymentData) => {
    return api.post(`/campaigns/${id}/pay`, paymentData);
  },

  getMyCampaigns: (params) => {
    return api.get('/campaigns', { params });
  },

  pauseCampaign: (id) => {
    return api.patch(`/campaigns/${id}/pause`);
  },

  resumeCampaign: (id) => {
    return api.patch(`/campaigns/${id}/resume`);
  }
};
