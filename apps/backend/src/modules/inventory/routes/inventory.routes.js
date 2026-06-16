import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

// Protect all inventory routes for Sellers only
router.use(protect);
router.use(allowRoles('SELLER'));

router.get('/:variantId', inventoryController.getInventory);
router.patch('/:variantId', inventoryController.adjustStock);
router.get('/:variantId/history', inventoryController.getHistory);

export default router;
