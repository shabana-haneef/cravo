import { Router } from 'express';
import { delhiveryController } from '../controllers/delhiveryController.js';
import { delhiveryShipmentController } from '../controllers/delhiveryShipmentController.js';
import { protect } from '../shared/middleware/auth.middleware.js';

const router = Router();

// Connection Test endpoint
router.get('/test', delhiveryController.testConnection);

// Pincode Serviceability Validation endpoint
router.get('/serviceability/:pincode', delhiveryController.checkServiceability);

// Create Shipment endpoint
router.post('/create-shipment/:orderId', protect, delhiveryShipmentController.createShipment);

export default router;
