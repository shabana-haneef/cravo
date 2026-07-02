import { api } from '../../../lib/axios.js';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (data) => {
    const response = await api.post('/auth/verify-email', data);
    return response.data;
  },

  resendOtp: async (data) => {
    const response = await api.post('/auth/resend-otp', data);
    return response.data;
  },

  forgotPassword: async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};
