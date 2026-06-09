import { Router } from 'express';
import { wishlistController } from '../controllers/wishlist.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// All wishlist routes are protected
router.use(protect);

router.post('/toggle', wishlistController.toggleWishlist);
router.get('/', wishlistController.getWishlist);
router.get('/status/:productId', wishlistController.checkWishlistStatus);

export default router;
