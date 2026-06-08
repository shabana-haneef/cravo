import { Router } from 'express';
import { addressController } from '../controllers/address.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

router.use(protect); // Secure all address routes

router.post('/', addressController.createAddress);
router.get('/', addressController.getAddresses);
router.get('/:id', addressController.getAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

export default router;
