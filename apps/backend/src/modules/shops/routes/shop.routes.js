import { Router } from 'express';
import { shopController } from '../controllers/shop.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';
import { upload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

// Protected Routes (Sellers Only - Specific Routes First)
router.get('/me', protect, allowRoles('SELLER'), shopController.getMyShop);

router.post('/', protect, allowRoles('SELLER'), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), shopController.createShop);

router.put('/me', protect, allowRoles('SELLER'), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), shopController.updateShop);

router.put('/me/timings', protect, allowRoles('SELLER'), shopController.updateTimings);

// Public Routes (Wildcard Routes Last)
router.get('/:slug', shopController.getPublicShop);

export default router;
