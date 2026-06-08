import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

// Webhook is public (verified via signature inside controller)
router.post('/webhook', deliveryController.handleWebhook);

// Protected Routes
router.use(protect);

router.get('/orders/:id/tracking', deliveryController.getTracking);
router.get('/seller/deliveries', allowRoles('SELLER'), deliveryController.getSellerDeliveries);
router.get('/admin/deliveries', allowRoles('ADMIN'), deliveryController.getAdminDeliveries);

export default router;
