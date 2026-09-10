import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// Webhook is public (verified via signature)
router.post('/webhook', paymentController.handleWebhook);

// Verification requires auth
router.use(protect);
router.post('/verify', paymentController.verifyPayment);

// Refund route (internal/admin or authorized users)
// Note: Assuming `protect` allows authorized roles or users to request refund.
router.post('/:paymentId/refund', paymentController.initiateRefund);

export default router;
