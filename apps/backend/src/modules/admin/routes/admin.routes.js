import { Router } from 'express';
import { adminSellerController } from '../controllers/admin.seller.controller.js';
import { categoryController } from '../../products/controllers/category.controller.js';
import { adminProductController } from '../controllers/admin.product.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

// Protect all admin routes
router.use(protect);
router.use(allowRoles('ADMIN'));

// Seller Applications
router.get('/seller-applications', adminSellerController.listApplications);
router.get('/seller-applications/:id', adminSellerController.getApplication);
router.patch('/seller-applications/:id/approve', adminSellerController.approveApplication);
router.patch('/seller-applications/:id/reject', adminSellerController.rejectApplication);

// Category Admin
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Product Review Admin
router.get('/products/pending', adminProductController.getPending);
router.patch('/products/:id/approve', adminProductController.approve);
router.patch('/products/:id/reject', adminProductController.reject);

export default router;
