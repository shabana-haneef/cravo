import { Router } from 'express';
import { adAdminController } from '../controllers/ad.admin.controller.js';
import { adSellerController } from '../controllers/ad.seller.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';
import { upload } from '../../../shared/middleware/upload.middleware.js';

import { adPublicController } from '../controllers/ad.public.controller.js';

export const adminAdRoutes = Router();
export const sellerAdRoutes = Router();
export const publicAdRoutes = Router();

// --- Public Ad Routes ---
publicAdRoutes.get('/active', adPublicController.getActiveAds);
publicAdRoutes.post('/:id/click', adPublicController.clickAd);

// --- Admin Ad Routes ---
adminAdRoutes.use(protect);
adminAdRoutes.use(allowRoles('ADMIN'));

adminAdRoutes.post('/packages', adAdminController.createPackage);
adminAdRoutes.get('/packages', adAdminController.listPackages);
adminAdRoutes.put('/packages/:id', adAdminController.updatePackage);
adminAdRoutes.delete('/packages/:id', adAdminController.deletePackage);

adminAdRoutes.get('/', adAdminController.listAllAds);
adminAdRoutes.post('/free', upload.single('image'), adAdminController.createAdminFreeAd);
adminAdRoutes.put('/:id/approve', adAdminController.approveAd);
adminAdRoutes.put('/:id/reject', adAdminController.rejectAd);

// --- Seller Ad Routes ---
sellerAdRoutes.use(protect);
sellerAdRoutes.use(allowRoles('SELLER'));

sellerAdRoutes.get('/packages', adSellerController.getPackages);
sellerAdRoutes.get('/', adSellerController.getMyAds);
sellerAdRoutes.post('/order', upload.single('image'), adSellerController.createAdOrder);
sellerAdRoutes.post('/verify', adSellerController.verifyPaymentAndSubmit);
