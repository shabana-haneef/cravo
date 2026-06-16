import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';

import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

import { upload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

// Public Routes
router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// Seller/Admin Routes
router.use(protect);
router.use(allowRoles('SELLER', 'ADMIN'));

router.post('/', upload.single('image'), categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
