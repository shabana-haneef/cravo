import { paymentService } from '../services/payment.service.js';
import { verifyPaymentSchema } from '../validators/order.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const paymentController = {
  async verifyPayment(req, res, next) {
    try {
      const parsed = verifyPaymentSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const result = await paymentService.verifyPayment(
        req.user.id,
        parsed.data.razorpayOrderId,
        parsed.data.razorpayPaymentId,
        parsed.data.razorpaySignature
      );
      
      return successResponse(res, 'Payment verified successfully', result);
    } catch (error) { next(error); }
  },

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      if (!signature) return errorResponse(res, 'Missing signature', 400);

      await paymentService.handleWebhook(req.body, signature);
      return res.status(200).send('OK');
    } catch (error) { next(error); }
  }
};
