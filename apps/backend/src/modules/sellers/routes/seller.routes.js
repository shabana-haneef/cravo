import { Router } from 'express';
import { sellerController } from '../controllers/seller.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { upload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

router.use(protect);

router.post('/apply', upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'shopImage', maxCount: 1 },
  { name: 'fssaiLicense', maxCount: 1 }
]), sellerController.apply);

router.get('/application', sellerController.getApplication);

export default router;
