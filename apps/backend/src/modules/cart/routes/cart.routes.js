import { Router } from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

router.use(protect); // All cart endpoints require user login

router.get('/', cartController.getCart);
router.delete('/', cartController.clearCart);

router.post('/items', cartController.addItem);
router.patch('/items/:itemId', cartController.updateItemQuantity);
router.delete('/items/:itemId', cartController.removeItem);

export default router;
