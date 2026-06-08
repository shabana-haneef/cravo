import { api } from '../../../lib/axios.js';

/**
 * GET /api/v1/sellers/application
 * Fetches the current user's seller application status.
 */
export const getSellerApplication = async () => {
  const { data } = await api.get('/sellers/application');
  return data;
};

/**
 * POST /api/v1/sellers/apply
 * Submits a seller application with KYC documents.
 * Uses multipart/form-data because it includes file uploads.
 * @param {FormData} formData
 */
export const applyAsSeller = async (formData) => {
  const { data } = await api.post('/sellers/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
