import { Router } from 'express';
import { adminSellerController } from '../controllers/admin.seller.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

// Secure entire admin domain
router.use(protect);
router.use(allowRoles('ADMIN'));

// Seller Applications
router.get('/seller-applications', adminSellerController.listApplications);
router.get('/seller-applications/:id', adminSellerController.getApplication);
router.patch('/seller-applications/:id/approve', adminSellerController.approveApplication);
router.patch('/seller-applications/:id/reject', adminSellerController.rejectApplication);

export default router;
