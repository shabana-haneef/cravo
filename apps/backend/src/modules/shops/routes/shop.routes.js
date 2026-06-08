import { Router } from 'express';
import { shopController } from '../controllers/shop.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';
import { upload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

// Public Routes
router.get('/:slug', shopController.getPublicShop);

// Protected Routes (Sellers Only)
router.use(protect);
router.use(allowRoles('SELLER'));

router.post('/', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), shopController.createShop);

router.get('/me', shopController.getMyShop);

router.put('/me', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), shopController.updateShop);

router.put('/me/timings', shopController.updateTimings);

export default router;
