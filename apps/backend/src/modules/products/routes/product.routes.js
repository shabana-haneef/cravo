import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { productVariantController } from '../controllers/productVariant.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';
import { upload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

// Public Routes
router.get('/', productController.getPublicProducts);
router.get('/suggestions', productController.getSuggestions);
router.get('/:slug', productController.getPublicProduct);

// Protected Routes (Sellers Only)
router.use(protect);
router.use(allowRoles('SELLER'));

router.post('/', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'labelImage', maxCount: 1 }]), productController.createProduct);
router.get('/me/all', productController.getMyProducts);
router.get('/me/:id', productController.getMyProductById);
router.put('/:id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'labelImage', maxCount: 1 }]), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Variant Routes
router.post('/:productId/variants', productVariantController.addVariant);
router.put('/:productId/variants/:variantId', productVariantController.updateVariant);
router.delete('/:productId/variants/:variantId', productVariantController.deleteVariant);

export default router;
