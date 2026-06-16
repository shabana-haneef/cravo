import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

router.use(protect);

// Customer Routes
router.get('/checkout/preview', orderController.getPreview);
router.post('/checkout', orderController.checkout);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);

// Seller Routes
router.get('/seller/orders', allowRoles('SELLER'), orderController.getSellerOrders);
router.patch('/seller/orders/:id/status', allowRoles('SELLER'), orderController.updateOrderStatus);

export default router;
