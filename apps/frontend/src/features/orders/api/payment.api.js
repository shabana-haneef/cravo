import { api } from '../../../lib/axios.js';

export const paymentApi = {
  verifyPayment: async (data) => {
    // data: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    const response = await api.post('/payments/verify', data);
    return response.data;
  }
};
