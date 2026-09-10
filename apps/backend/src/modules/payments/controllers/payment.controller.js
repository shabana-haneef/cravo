import { paymentService } from '../services/payment.service.js';
import { refundService } from '../services/refund.service.js';
import { verifyPaymentSchema } from '../../orders/validators/order.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const paymentController = {
  async initiateRefund(req, res, next) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

      if (!idempotencyKey) {
        return errorResponse(res, 'Idempotency-Key header is required', 400);
      }
      if (!amount || amount <= 0) {
        return errorResponse(res, 'Valid amount is required', 400);
      }

      const result = await refundService.initiateRefund(paymentId, amount, reason, idempotencyKey);
      
      return successResponse(res, 'Refund initiation processed', result);
    } catch (error) { next(error); }
  },

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
      const eventId = req.headers['x-razorpay-event-id'];
      if (!signature) return errorResponse(res, 'Missing signature', 400);

      await paymentService.handleWebhook(req.rawBody || req.body, req.body, signature, eventId);
      return res.status(200).send('OK');
    } catch (error) { next(error); }
  }
};
