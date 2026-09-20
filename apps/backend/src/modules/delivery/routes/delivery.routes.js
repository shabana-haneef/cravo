import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

// Webhook is public (verified via signature inside controller)
router.post('/webhook', deliveryController.handleWebhook);

// Public Tracking
router.get('/track/:identifier', deliveryController.getPublicTracking);

// Protected Routes
router.use(protect);

router.get('/orders/:id/tracking', deliveryController.getTracking);
router.post('/orders/:id/retry-shipment', allowRoles('SELLER'), deliveryController.retryShipment);
router.post('/orders/:id/retry-pickup', allowRoles('SELLER'), deliveryController.retryPickup);
router.post('/orders/:id/retry-label', allowRoles('SELLER'), deliveryController.retryLabel);

// Generate/View Shipping Label Routes
router.get('/:id/shipping-label', allowRoles('SELLER', 'ADMIN'), deliveryController.getShippingLabel);
router.get('/orders/:id/shipping-label', allowRoles('SELLER', 'ADMIN'), deliveryController.getShippingLabel);

router.get('/seller/deliveries', allowRoles('SELLER'), deliveryController.getSellerDeliveries);
router.get('/admin/deliveries', allowRoles('ADMIN'), deliveryController.getAdminDeliveries);

// Dedicated Shipment Updation / Edit Route
router.patch('/:id/shipment', allowRoles('SELLER', 'ADMIN'), deliveryController.updateShipment);

// Dedicated Shipment Cancellation Routes
router.post('/:id/cancel', allowRoles('SELLER', 'ADMIN'), deliveryController.cancelShipment);
router.post('/orders/:id/cancel', allowRoles('SELLER', 'ADMIN'), deliveryController.cancelShipment);

// Dedicated Pickup Cancellation Routes
router.post('/:id/pickup/cancel', allowRoles('SELLER', 'ADMIN'), deliveryController.cancelPickup);
router.post('/orders/:id/pickup/cancel', allowRoles('SELLER', 'ADMIN'), deliveryController.cancelPickup);

// Dedicated Pickup Scheduling / Rescheduling Routes
router.post('/:id/pickup/reschedule', allowRoles('SELLER', 'ADMIN'), deliveryController.reschedulePickup);
router.post('/orders/:id/pickup/reschedule', allowRoles('SELLER', 'ADMIN'), deliveryController.reschedulePickup);

// Dedicated E-Waybill Update Routes
router.put('/:id/ewaybill', allowRoles('SELLER', 'ADMIN'), deliveryController.updateEwaybill);
router.put('/orders/:id/ewaybill', allowRoles('SELLER', 'ADMIN'), deliveryController.updateEwaybill);

export default router;

