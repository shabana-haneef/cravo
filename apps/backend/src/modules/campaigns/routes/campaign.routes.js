import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';
import { upload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

// Seller Routes
router.post(
  '/product-promotion', 
  protect, 
  allowRoles('SELLER'), 
  upload.single('banner'), 
  campaignController.createProductPromotion
);

router.post(
  '/storewide-offer', 
  protect, 
  allowRoles('SELLER'), 
  upload.single('banner'), 
  campaignController.createStorewideOffer
);

router.post(
  '/discount', 
  protect, 
  allowRoles('SELLER'), 
  upload.single('banner'), 
  campaignController.createDiscountCampaign
);

router.post(
  '/flash-sale', 
  protect, 
  allowRoles('SELLER'), 
  upload.single('banner'), 
  campaignController.createFlashSale
);

router.post(
  '/:id/pay', 
  protect, 
  allowRoles('SELLER'), 
  campaignController.verifyPayment
);

router.get(
  '/', 
  protect, 
  allowRoles('SELLER'), 
  campaignController.getMyCampaigns
);

router.patch(
  '/:id/pause', 
  protect, 
  allowRoles('SELLER'), 
  campaignController.pauseCampaign
);

router.patch(
  '/:id/resume', 
  protect, 
  allowRoles('SELLER'), 
  campaignController.resumeCampaign
);

// Admin Routes
router.get(
  '/admin/pending', 
  protect, 
  allowRoles('ADMIN'), 
  campaignController.getPendingCampaigns
);

router.patch(
  '/admin/:id/approve', 
  protect, 
  allowRoles('ADMIN'), 
  campaignController.approveCampaign
);

router.patch(
  '/admin/:id/reject', 
  protect, 
  allowRoles('ADMIN'), 
  campaignController.rejectCampaign
);

// Public/App Route for Analytics
router.post(
  '/:id/track',
  campaignController.trackAnalytics
);

export default router;
