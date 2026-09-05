import { jest } from '@jest/globals';
import { deliveryService } from '../services/delivery.service.js';
import { delhiveryShipmentService } from '../services/delhiveryShipmentService.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { delhiveryShipmentController } from '../controllers/delhiveryShipmentController.js';


// Mock queue manager before imports
await jest.unstable_mockModule('../../../shared/utils/queue.manager.js', () => {
  return {
    createQueue: jest.fn(() => ({
      add: jest.fn().mockResolvedValue(true)
    })),
    createWorker: jest.fn()
  };
});

const { startReconciliationJob } = await import('../jobs/reconciliation.job.js');

describe('Seller Fulfillment Workflow - Production Readiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    
    // Mock Delhivery Shipment Service
    jest.spyOn(delhiveryShipmentService, 'findShipmentByOrderNumber').mockResolvedValue(null);
    jest.spyOn(delhiveryShipmentService, 'createShipment').mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });
    jest.spyOn(delhiveryShipmentService, 'createPickupRequest').mockResolvedValue({});
    jest.spyOn(delhiveryShipmentService, 'generateShippingLabel').mockResolvedValue('http://label');
    jest.spyOn(delhiveryShipmentService, 'trackShipment').mockResolvedValue({ status: 'Delivered' });

    // Mock Prisma
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.order, 'update').mockResolvedValue({});
    jest.spyOn(prisma.delivery, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.delivery, 'upsert').mockResolvedValue({});
    jest.spyOn(prisma.delivery, 'update').mockResolvedValue({});
    jest.spyOn(prisma.delivery, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.seller, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.deliveryTrackingEvent, 'create').mockResolvedValue({});
    jest.spyOn(prisma.orderShipmentLog, 'create').mockResolvedValue({});
    
    // Special handling for $transaction to immediately execute the callback with the real prisma (which is spied upon)
    jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      // If it's an array of promises, return them resolved
      return Promise.all(callback);
    });
  });

  describe('1. Delhivery Shipment Recovery', () => {
    it('reuses existing shipment if Cravo DB fails initially', async () => {
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1' } } };
      prisma.order.findUnique.mockResolvedValue(order);
      
      // Simulate existing shipment on Delhivery
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue({ trackingNumber: 'AWB123', status: 'BOOKED' });
      
      // Mock createPickupRequest
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({ pickupId: 'P123', pickupDate: '2026-09-06', pickupTime: '10:00' });
      delhiveryShipmentService.generateShippingLabel.mockResolvedValue('http://label');

      await deliveryService.initiateDelivery('order_1');

      expect(delhiveryShipmentService.createShipment).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
    it('creates new shipment if none exists', async () => {
      const order = { id: 'order_2', orderNumber: 'ORD-124', address: {}, shop: { seller: { pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1' } } };
      prisma.order.findUnique.mockResolvedValue(order);
      
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB124', shipmentId: 'SHP124' });
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({ pickupId: 'P124', pickupDate: '2026-09-06', pickupTime: '10:00' });
      delhiveryShipmentService.generateShippingLabel.mockResolvedValue('http://label');

      await deliveryService.initiateDelivery('order_2');

      expect(delhiveryShipmentService.createShipment).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('2. Shipment Retry', () => {
    it('retries FAILED shipment and updates state correctly', async () => {
      const mockDelivery = { status: 'FAILED', order: { shop: { sellerId: 'seller_1' } } };
      prisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      prisma.seller.findUnique.mockResolvedValue({ id: 'seller_1', userId: 'user_1' });
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1' } } };
      prisma.order.findUnique.mockResolvedValue(order);
      
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({});

      await deliveryService.retryShipment('order_1', 'user_1');
      expect(delhiveryShipmentService.createShipment).toHaveBeenCalled();
    });

    it('fails if shipment is not FAILED', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ status: 'CREATED', order: { shop: { sellerId: 'seller_1' } }, updatedAt: new Date() });
      await expect(deliveryService.retryShipment('order_1', 'user_1')).rejects.toThrow('Only failed or stale shipments can be retried');
    });
  });

  describe('3. Label Retry', () => {
    it('retries label generation and updates DB', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', shippingLabelUrl: null, order: { shop: { sellerId: 'seller_1' } } });
      prisma.seller.findUnique.mockResolvedValue({ id: 'seller_1', userId: 'user_1' });
      delhiveryShipmentService.generateShippingLabel.mockResolvedValue('http://newlabel');

      const result = await deliveryService.retryLabel('order_1', 'user_1');
      expect(result.shippingLabelUrl).toBe('http://newlabel');
      expect(prisma.delivery.update).toHaveBeenCalled();
    });

    it('fails if label already exists', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', shippingLabelUrl: 'http://existing', order: { shop: { sellerId: 'seller_1' } } });
      await expect(deliveryService.retryLabel('order_1', 'user_1')).rejects.toThrow('Label is already generated');
    });
  });

  describe('4. Pickup Retry', () => {
    it('retries pickup scheduling and updates DB', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', pickupRequestId: null, order: { shop: { sellerId: 'seller_1', seller: {} } } });
      prisma.seller.findUnique.mockResolvedValue({ id: 'seller_1', userId: 'user_1' });
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({ pickupId: 'P123', pickupDate: '2026-09-06', pickupTime: '10:00' });

      const result = await deliveryService.retryPickup('order_1', 'user_1');
      expect(result.pickupData.pickupId).toBe('P123');
      expect(prisma.delivery.update).toHaveBeenCalled();
    });

    it('fails if pickup already scheduled', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', pickupRequestId: 'P123', order: { shop: { sellerId: 'seller_1' } } });
      await expect(deliveryService.retryPickup('order_1', 'user_1')).rejects.toThrow('Pickup is already scheduled');
    });
  });

  describe('6. Webhook State Machine', () => {
    it('allows forward transitions (IN_TRANSIT -> OUT_FOR_DELIVERY)', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'IN_TRANSIT', order: {} });
      await deliveryService.handleWebhookEvent({ awb: 'AWB123', status: 'Out for Delivery' });
      expect(prisma.$transaction).toHaveBeenCalled(); // Means updateDeliveryStatus was called
    });

    it('rejects backward transitions (DELIVERED -> IN_TRANSIT)', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'DELIVERED', order: {} });
      await deliveryService.handleWebhookEvent({ awb: 'AWB123', status: 'In Transit' });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('allows NDR -> OUT_FOR_DELIVERY reattempts', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'NDR', order: {} });
      await deliveryService.handleWebhookEvent({ awb: 'AWB123', status: 'Out for Delivery' });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('7. Reconciliation Job', () => {
    it('processes stale shipments', async () => {
      const { createWorker } = await import('../../../shared/utils/queue.manager.js');
      
      prisma.delivery.findMany.mockResolvedValue([
        { id: 'del_1', trackingNumber: 'AWB123', status: 'IN_TRANSIT', orderId: 'ord_1' }
      ]);
      delhiveryShipmentService.trackShipment.mockResolvedValue({ status: 'Delivered' });
      prisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'IN_TRANSIT', order: {} });
      
      startReconciliationJob();
      const jobFn = createWorker.mock.calls[0][1];
      await jobFn({});

      expect(prisma.delivery.findMany).toHaveBeenCalled();
      expect(delhiveryShipmentService.trackShipment).toHaveBeenCalledWith('AWB123');
      expect(prisma.$transaction).toHaveBeenCalled(); // handleWebhookEvent executed
    });
  });
  
  describe('8. Concurrency & Idempotency Fixes', () => {
    it('prevents concurrent initiateDelivery calls from duplicating Delhivery shipments', async () => {
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1' } } };
      prisma.order.findUnique.mockResolvedValue(order);
      
      // Simulate state where 1st gets lock, others get LOCKED
      prisma.$transaction.mockImplementation(async (callback) => {
        // Mock the internal logic of the atomic claim
        return { status: 'CLAIMED', delivery: { id: 'del_1', status: 'CREATING' } };
      });
      // The service throws LOCKED if status === 'LOCKED'. So we'll mock the transaction to return CLAIMED for first call, LOCKED for subsequent
      let callCount = 0;
      prisma.$transaction.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return { status: 'CLAIMED', delivery: { id: 'del_1', status: 'CREATING' } };
        return { status: 'LOCKED' };
      });
      
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });

      // Fire 5 concurrent requests
      const requests = Array.from({ length: 5 }).map(() => deliveryService.initiateDelivery('order_1'));
      
      const results = await Promise.allSettled(requests);
      
      // 1 should succeed, 4 should reject with 409
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');
      
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(4);
      expect(rejected[0].reason.message).toContain('Shipment is currently being processed');
      
      // Delhivery API should only be called ONCE
      expect(delhiveryShipmentService.createShipment).toHaveBeenCalledTimes(1);
    });

    it('allows retry if CREATING state is stale (> 2 mins)', async () => {
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1' } } };
      prisma.order.findUnique.mockResolvedValue(order);
      
      prisma.$transaction.mockImplementation(async () => {
        return { status: 'CLAIMED', delivery: { id: 'del_1', status: 'CREATING' } };
      });

      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });

      await deliveryService.initiateDelivery('order_1');
      expect(delhiveryShipmentService.createShipment).toHaveBeenCalledTimes(1);
    });

    it('recovers AWB if Delhivery succeeded but local DB update crashed', async () => {
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1' } } };
      prisma.order.findUnique.mockResolvedValue(order);
      
      prisma.$transaction.mockImplementation(async () => {
        return { status: 'CLAIMED', delivery: { id: 'del_1', status: 'CREATING' } };
      });

      // Simulate Delhivery API already has the shipment from a previous crashed run
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue({ trackingNumber: 'AWB_CRASHED', success: true });
      
      await deliveryService.initiateDelivery('order_1');
      
      // It should NOT call createShipment again
      expect(delhiveryShipmentService.createShipment).not.toHaveBeenCalled();
    });
  });

  describe('9. Manual Controller Concurrency', () => {
    it('prevents Two simultaneous manual Create Shipment requests from duplicating Delhivery create call', async () => {
      const order = { id: 'order_1', status: 'CONFIRMED', orderNumber: 'ORD-123', address: { fullName: 'Test', phone: '123', addressLine1: 'Add1', city: 'City', state: 'State', postalCode: '123' }, shop: { seller: { userId: 'user_1', pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1', pickupAddress: 'A', pickupCity: 'C', pickupState: 'S', pickupPincode: 'P', pickupPhone: '1' } } };
      prisma.order.findUnique.mockResolvedValue(order);

      let callCount = 0;
      prisma.$transaction.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return { status: 'CLAIMED', delivery: { id: 'del_1', status: 'CREATING' } };
        return { status: 'LOCKED' };
      });

      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });

      const req = { params: { orderId: 'order_1' }, user: { role: 'SELLER', id: 'user_1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      const requests = Array.from({ length: 2 }).map(() => delhiveryShipmentController.createShipment(req, res, {}));
      await Promise.all(requests);

      // Only one Delhivery call should happen
      expect(delhiveryShipmentService.createShipment).toHaveBeenCalledTimes(1);
    });

    it('prevents Manual Create Shipment + automatic initiateDelivery simultaneously from duplicating Delhivery create call', async () => {
      const order = { id: 'order_1', status: 'CONFIRMED', orderNumber: 'ORD-123', address: { fullName: 'Test', phone: '123', addressLine1: 'Add1', city: 'City', state: 'State', postalCode: '123' }, shop: { seller: { userId: 'user_1', pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1', pickupAddress: 'A', pickupCity: 'C', pickupState: 'S', pickupPincode: 'P', pickupPhone: '1' } } };
      prisma.order.findUnique.mockResolvedValue(order);

      let callCount = 0;
      prisma.$transaction.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return { status: 'CLAIMED', delivery: { id: 'del_1', status: 'CREATING' } };
        return { status: 'LOCKED' };
      });

      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });

      const req = { params: { orderId: 'order_1' }, user: { role: 'SELLER', id: 'user_1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      const manualReq = delhiveryShipmentController.createShipment(req, res, {});
      const autoReq = deliveryService.initiateDelivery('order_1');
      const results = await Promise.allSettled([manualReq, autoReq]);

      expect(delhiveryShipmentService.createShipment).toHaveBeenCalledTimes(1);
    });

    it('prevents Multiple simultaneous retries from creating more than one shipment', async () => {
      const mockDelivery = { status: 'FAILED', order: { shop: { sellerId: 'seller_1' } } };
      prisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      prisma.seller.findUnique.mockResolvedValue({ id: 'seller_1', userId: 'user_1' });
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1', delhiveryRegistrationStatus: 'REGISTERED', delhiveryPickupLocationId: 'L1' } } };
      prisma.order.findUnique.mockResolvedValue(order);

      let callCount = 0;
      prisma.$transaction.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return { status: 'CLAIMED', delivery: { id: 'del_1', status: 'CREATING' } };
        return { status: 'LOCKED' };
      });

      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });

      const requests = Array.from({ length: 3 }).map(() => deliveryService.retryShipment('order_1', 'user_1'));
      const results = await Promise.allSettled(requests);

      expect(delhiveryShipmentService.createShipment).toHaveBeenCalledTimes(1);
    });
  });

  describe('10. Production Credentials Enforcement', () => {
    it('throws AppError if production token is missing for pickup, label, tracking operations', async () => {
      // Un-mock delhiveryShipmentService to test its real logic
      jest.restoreAllMocks();
      
      const realService = await import('../services/delhiveryShipmentService.js');
      // Ensure no environment variables for token exist
      delete process.env.DELHIVERY_API_TOKEN;
      delete process.env.DELHIVERY_API_KEY;

      await expect(realService.delhiveryShipmentService.createPickupRequest({})).rejects.toThrow('Delhivery API key missing');
      await expect(realService.delhiveryShipmentService.generateShippingLabel('AWB')).rejects.toThrow('Delhivery API key missing');
      await expect(realService.delhiveryShipmentService.trackShipment('AWB')).rejects.toThrow('Delhivery API key missing');
      await expect(realService.delhiveryShipmentService.createShipment({}, {}, {})).rejects.toThrow('Delhivery API key missing');
    });
  });
});
