import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// Webhook is public (verified via signature)
router.post('/webhook', paymentController.handleWebhook);

// Verification requires auth
router.use(protect);
router.post('/verify', paymentController.verifyPayment);

export default router;
