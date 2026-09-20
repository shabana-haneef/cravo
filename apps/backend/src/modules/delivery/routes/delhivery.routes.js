import { Router } from 'express';
import { delhiveryController } from '../controllers/delhiveryController.js';
import { delhiveryShipmentController } from '../controllers/delhiveryShipmentController.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

// Connection Test endpoint
router.get('/test', delhiveryController.testConnection);

// Pincode Serviceability Validation endpoints
router.get('/serviceability/heavy/:pincode', (req, res, next) => {
  req.query.productType = 'Heavy';
  return delhiveryController.checkServiceability(req, res, next);
});
router.get('/serviceability/:pincode', delhiveryController.checkServiceability);

// Create Shipment endpoint
router.post('/create-shipment/:orderId', protect, delhiveryShipmentController.createShipment);

// Shipping Cost Calculator (Internal tool for Seller/Admin)
router.get('/shipping-cost', protect, allowRoles('SELLER', 'ADMIN'), delhiveryController.calculateShippingCost);

export default router;
