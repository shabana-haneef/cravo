import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';

const router = Router();

// Public Routes
router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

export default router;
