import { Router } from 'express';
import { sellerController } from '../controllers/seller.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { upload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

router.use(protect);

router.post('/apply', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'shopLogo', maxCount: 1 },
  { name: 'shopBanner', maxCount: 1 },
  { name: 'fssaiLicense', maxCount: 1 }
]), sellerController.apply);

router.get('/application', sellerController.getApplication);

router.get('/settings/payout', sellerController.getPayoutSettings);
router.post('/settings/payout/otp/request', sellerController.requestPayoutUpdateOtp);
router.put('/settings/payout', sellerController.updatePayoutSettings);

router.get('/settings/notifications', sellerController.getNotificationPreferences);
router.put('/settings/notifications', sellerController.updateNotificationPreferences);

router.get('/settings/profile', sellerController.getStoreProfile);
router.put('/settings/profile', sellerController.updateStoreProfile);

export default router;
