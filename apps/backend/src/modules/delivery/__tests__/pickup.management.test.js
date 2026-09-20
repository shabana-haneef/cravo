import { jest } from '@jest/globals';
import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';

// Setup environment
process.env.DELHIVERY_API_TOKEN = 'test_delhivery_token_pickup';
process.env.DELHIVERY_ENV = 'prod';

// Mock Redis
const mockRedis = {
  isOpen: true,
  get: jest.fn(),
  setEx: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  on: jest.fn(),
  duplicate: jest.fn().mockReturnValue({ on: jest.fn() }),
  zRemRangeByScore: jest.fn().mockResolvedValue(1),
  zCard: jest.fn().mockResolvedValue(0),
  zAdd: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1)
};

await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: mockRedis,
  pubClient: mockRedis,
  subClient: mockRedis
}));

// Mock logger
await jest.unstable_mockModule('../../../shared/services/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock refundService
const mockRefundService = {
  initiateRefund: jest.fn()
};

await jest.unstable_mockModule('../../payments/services/refund.service.js', () => ({
  refundService: mockRefundService
}));

// Mock reconciliationQueue
const mockReconciliationQueue = {
  add: jest.fn().mockResolvedValue({})
};

await jest.unstable_mockModule('../jobs/reconciliation.job.js', () => ({
  reconciliationQueue: mockReconciliationQueue
}));

// Mock prisma
const mockPrisma = {
  delivery: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn()
  },
  order: {
    findUnique: jest.fn(),
    update: jest.fn().mockResolvedValue({})
  },
  inventory: {
    findUnique: jest.fn(),
    updateMany: jest.fn()
  },
  inventoryTransaction: {
    create: jest.fn()
  },
  orderShipmentLog: {
    create: jest.fn().mockResolvedValue({})
  },
  deliveryTrackingEvent: {
    create: jest.fn().mockResolvedValue({})
  },
  integrationLog: {
    create: jest.fn().mockResolvedValue({})
  },
  delhiveryWaybill: {
    updateMany: jest.fn()
  },
  $transaction: jest.fn(async (cb) => cb(mockPrisma))
};

await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: mockPrisma
}));

await jest.unstable_mockModule('../../../config/prisma.js', () => ({
  default: mockPrisma
}));

// Import services after mocks
const { delhiveryShipmentService } = await import('../services/delhiveryShipmentService.js');
const { deliveryService } = await import('../services/delivery.service.js');

describe('Delhivery Pickup Cancellation & Rescheduling Architecture', () => {
  let axiosPostSpy;

  const mockSeller = {
    id: 'seller_1',
    userId: 'seller_user_1',
    businessName: 'Cravo Artisans',
    pickupLocationName: 'Cravo Artisans',
    pickupAddress: {
      addressLine1: 'Warehouse 42, Industrial Area',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122002'
    }
  };

  const mockOrder = {
    id: 'ord_123',
    orderNumber: 'ORD-98765',
    customerId: 'cust_123',
    status: 'SELLER_ACCEPTED',
    createdAt: new Date(),
    shippingLabelUrl: 'https://cdn.delhivery.com/label.pdf',
    items: [
      { productVariantId: 'var_1', quantity: 1 }
    ],
    payments: [
      { id: 'pay_123', amount: 2000, status: 'SUCCESS' }
    ],
    shop: {
      id: 'shop_1',
      sellerId: 'seller_1',
      seller: mockSeller
    }
  };

  const mockDelivery = {
    id: 'del_123',
    orderId: 'ord_123',
    trackingNumber: '56047210000888',
    delhiveryShipmentId: 'ORD-98765',
    status: 'PICKUP_SCHEDULED',
    pickupRequestId: 'PR_1001',
    pickupDate: '2026-09-25',
    pickupSlot: '14:00:00',
    shippingLabelUrl: 'https://cdn.delhivery.com/label.pdf',
    order: mockOrder
  };

  const sellerActor = {
    id: 'seller_user_1',
    userId: 'seller_user_1',
    role: 'SELLER',
    sellerId: 'seller_1'
  };

  const strangerActor = {
    id: 'stranger_user',
    userId: 'stranger_user',
    role: 'SELLER',
    sellerId: 'seller_999'
  };

  const adminActor = {
    id: 'admin_user',
    userId: 'admin_user',
    role: 'ADMIN'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axiosPostSpy = jest.spyOn(axios.Axios.prototype, 'post');
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);

    mockPrisma.delivery.findFirst.mockImplementation(async ({ where }) => {
      // If we are looking for the shared pickup (id: { not: ... }), return null by default in tests
      if (where && where.id && where.id.not) {
        return null;
      }
      return JSON.parse(JSON.stringify(mockDelivery));
    });
    mockPrisma.delivery.findMany.mockResolvedValue([]);
    mockPrisma.delivery.update.mockImplementation(async ({ data }) => ({
      ...mockDelivery,
      ...data
    }));
    mockPrisma.order.findUnique.mockResolvedValue(JSON.parse(JSON.stringify(mockOrder)));
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
  });

  afterEach(() => {
    axiosPostSpy.mockRestore();
  });

  describe('1. Delhivery Client Service (/fm/request/new/ & /fm/request/cancel/)', () => {
    it('creates pickup request with pickup_date and pickup_time', async () => {
      axiosPostSpy.mockResolvedValueOnce({
        data: {
          pickup_id: 'PR_2002',
          pickup_date: '2026-09-26',
          pickup_time: '11:00:00'
        }
      });

      const res = await delhiveryShipmentService.createPickupRequest(mockSeller, 1, {
        pickupDate: '2026-09-26',
        pickupTime: '11:00:00'
      });

      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      const [url, payload] = axiosPostSpy.mock.calls[0];
      expect(url).toBe('/fm/request/new/');
      expect(payload.pickup_location).toBe('Cravo Artisans');
      expect(Number(payload.expected_package_count)).toBe(1);
      expect(payload.pickup_date).toBe('2026-09-26');
      expect(payload.pickup_time).toBe('11:00:00');
      expect(res.pickupId).toBe('PR_2002');
      expect(res.pickupDate).toBe('2026-09-26');
      expect(payload.pickup_time).toBe('11:00:00');
      expect(res.pickupId).toBe('PR_2002');
      expect(res.pickupDate).toBe('2026-09-26');
      expect(res.pickupTime).toBe('11:00:00');
    });

    it('validates expectedPackageCount as integer > 0', async () => {
      await expect(
        delhiveryShipmentService.createPickupRequest(mockSeller, 0)
      ).rejects.toThrow('expected_package_count must be a positive integer');

      await expect(
        delhiveryShipmentService.createPickupRequest(mockSeller, -1)
      ).rejects.toThrow('expected_package_count must be a positive integer');

      await expect(
        delhiveryShipmentService.createPickupRequest(mockSeller, 1.5)
      ).rejects.toThrow('expected_package_count must be a positive integer');
    });

    it('enforces 4000/5m rate limit', async () => {
      mockRedis.zCard.mockResolvedValueOnce(4000);
      
      await expect(
        delhiveryShipmentService.createPickupRequest(mockSeller, 1)
      ).rejects.toThrow('Delhivery pickup creation rate limit exceeded');
    });

    it('cancels pickup request via POST /fm/request/cancel/ without blind retries', async () => {
      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true, message: 'Pickup request cancelled successfully' }
      });

      const res = await delhiveryShipmentService.cancelPickupRequest({
        pickupId: 'PR_1001',
        pickupLocation: 'Cravo Artisans'
      });

      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      const [url, payload] = axiosPostSpy.mock.calls[0];
      expect(url).toBe('/fm/request/cancel/');
      expect(payload.pickup_id).toBe('PR_1001');
      expect(payload.pickup_location).toBe('Cravo Artisans');
      expect(res.success).toBe(true);
    });

    it('handles ambiguous timeout on cancelPickupRequest without retrying', async () => {
      const timeoutErr = new Error('Gateway Timeout');
      timeoutErr.code = 'ECONNABORTED';
      axiosPostSpy.mockRejectedValueOnce(timeoutErr);

      await expect(
        delhiveryShipmentService.cancelPickupRequest({
          pickupId: 'PR_1001',
          pickupLocation: 'Cravo Artisans'
        })
      ).rejects.toMatchObject({
        code: 'DELHIVERY_PICKUP_CANCEL_TIMEOUT',
        isAmbiguous: true
      });

      // No blind retry!
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('handles ambiguous timeout on createPickupRequest without retrying', async () => {
      const timeoutErr = new Error('Connection reset');
      timeoutErr.code = 'ETIMEDOUT';
      axiosPostSpy.mockRejectedValueOnce(timeoutErr);

      await expect(
        delhiveryShipmentService.createPickupRequest(mockSeller, 1, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'DELHIVERY_PICKUP_SCHEDULE_TIMEOUT',
        isAmbiguous: true
      });

      // No blind retry!
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Cancellation Invariants & Architecture', () => {
    it('successfully cancels pickup and preserves all invariant fields', async () => {
      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true, message: 'Cancelled' }
      });

      const result = await deliveryService.cancelPickup('del_123', sellerActor, {
        reason: 'Warehouse closed today'
      });

      expect(result.success).toBe(true);
      expect(result.deliveryStatus).toBe('BOOKED');
      expect(result.pickupRequestId).toBeNull();
      expect(result.pickupDate).toBeNull();
      expect(result.pickupSlot).toBeNull();

      // Verify DB update on delivery table
      expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del_123' },
          data: expect.objectContaining({
            status: 'BOOKED',
            pickupRequestId: null,
            pickupDate: null,
            pickupSlot: null
          })
        })
      );

      // Invariant: DelhiveryWaybill remains USED (no release or status change)
      expect(mockPrisma.delhiveryWaybill.updateMany).not.toHaveBeenCalled();

      // Invariant: Stock unchanged
      expect(mockPrisma.inventory.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.inventoryTransaction.create).not.toHaveBeenCalled();

      // Invariant: Payment/refund unchanged
      expect(mockRefundService.initiateRefund).not.toHaveBeenCalled();

      // Invariant: DeliveryTrackingEvent is NOT created
      expect(mockPrisma.deliveryTrackingEvent.create).not.toHaveBeenCalled();

      // Audit log is created
      expect(mockPrisma.orderShipmentLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'ord_123',
            event: 'Pickup Cancelled'
          })
        })
      );
    });

    it('rejects unauthorized cancellation attempts from non-owner sellers', async () => {
      await expect(
        deliveryService.cancelPickup('del_123', strangerActor)
      ).rejects.toThrow('Unauthorized: You do not have permission to cancel pickup');

      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    });

    it('permits admin to cancel pickup', async () => {
      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true }
      });

      const result = await deliveryService.cancelPickup('del_123', adminActor);
      expect(result.success).toBe(true);
      expect(mockPrisma.delivery.update).toHaveBeenCalled();
    });

    it('rejects cancellation if shipment is already in physical transit', async () => {
      const inTransitDelivery = {
        ...mockDelivery,
        status: 'IN_TRANSIT'
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(inTransitDelivery);

      await expect(
        deliveryService.cancelPickup('del_123', sellerActor)
      ).rejects.toThrow('Pickup cannot be cancelled after courier pickup has already occurred');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('preserves shared pickupRequestId when sibling deliveries exist', async () => {
      // Sibling delivery sharing the same pickupRequestId
      mockPrisma.delivery.findMany.mockResolvedValueOnce([
        { id: 'del_sibling_456' }
      ]);

      const result = await deliveryService.cancelPickup('del_123', sellerActor);

      expect(result.success).toBe(true);
      // Delhivery API cancel is NOT called because other orders depend on this pickup!
      expect(axiosPostSpy).not.toHaveBeenCalled();

      // Local delivery fields are still cleared
      expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del_123' },
          data: expect.objectContaining({
            status: 'BOOKED',
            pickupRequestId: null
          })
        })
      );
    });
  });

  describe('3. Rescheduling Invariants & Date/Time Validation', () => {
    it('successfully reschedules pickup and maintains invariants', async () => {
      // 1. Cancel old pickup
      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true }
      });
      // 2. Create new pickup
      axiosPostSpy.mockResolvedValueOnce({
        data: {
          pickup_id: 'PR_3003',
          pickup_date: '2026-09-27',
          pickup_time: '15:00:00'
        }
      });

      const result = await deliveryService.reschedulePickup('del_123', sellerActor, {
        pickupDate: '2026-09-27',
        pickupTime: '15:00:00'
      });

      expect(result.success).toBe(true);
      expect(result.deliveryStatus).toBe('PICKUP_SCHEDULED');
      expect(result.pickupRequestId).toBe('PR_3003');
      expect(result.pickupDate).toBe('2026-09-27');
      expect(result.pickupSlot).toBe('15:00:00');

      // Check DB update
      expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del_123' },
          data: expect.objectContaining({
            status: 'PICKUP_SCHEDULED',
            pickupRequestId: 'PR_3003',
            pickupDate: '2026-09-27',
            pickupSlot: '15:00:00'
          })
        })
      );

      // Invariants
      expect(mockPrisma.delhiveryWaybill.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.inventory.updateMany).not.toHaveBeenCalled();
      expect(mockRefundService.initiateRefund).not.toHaveBeenCalled();
      expect(mockPrisma.deliveryTrackingEvent.create).not.toHaveBeenCalled();

      // Audit log
      expect(mockPrisma.orderShipmentLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'Pickup Rescheduled'
          })
        })
      );
    });

    it('rejects rescheduling an individual shipment that belongs to a shared pickup request to prevent duplicate active pickups', async () => {
      // Sibling delivery shares the same pickupRequestId PR_1001
      mockPrisma.delivery.findMany.mockResolvedValueOnce([
        { id: 'del_sibling_456' }
      ]);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'SHARED_PICKUP_RESCHEDULE_UNSUPPORTED',
        message: expect.stringContaining('Delhivery does not support partial modification of shared pickup requests')
      });

      // Crucial: No calls made to Delhivery, no duplicate active pickup created!
      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    });

    it('shares pickup requestId when rescheduling to a slot that already has a pickup for this seller', async () => {
      // Setup finding the Delivery to reschedule
      const deliveryToReschedule = JSON.parse(JSON.stringify(mockDelivery));
      deliveryToReschedule.pickupRequestId = 'PR_OLD';
      
      // Setup finding the shared pickup
      const existingSharedPickup = JSON.parse(JSON.stringify(mockDelivery));
      existingSharedPickup.id = 'del_999';
      existingSharedPickup.pickupRequestId = 'PR_SHARED';
      existingSharedPickup.pickupDate = '2026-09-26';
      existingSharedPickup.pickupSlot = '11:00:00';
      existingSharedPickup.status = 'PICKUP_SCHEDULED';

      mockPrisma.delivery.findFirst.mockImplementation(async ({ where }) => {
        if (where && where.id && where.id.not) {
          return existingSharedPickup;
        }
        return deliveryToReschedule;
      });

      mockPrisma.delivery.findMany.mockResolvedValueOnce([]); // old pickup is not shared

      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true } // cancel old pickup
      });
      // NO new pickup creation API call should be made!

      const res = await deliveryService.reschedulePickup('del_123', sellerActor, {
        pickupDate: '2026-09-26',
        pickupTime: '11:00:00'
      });

      // Verify the new active pickup was NOT created, but shared PR_SHARED was used
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      const [url] = axiosPostSpy.mock.calls[0];
      expect(url).toBe('/fm/request/cancel/');

      expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'del_123' },
        data: expect.objectContaining({
          pickupRequestId: 'PR_SHARED',
          pickupDate: '2026-09-26',
          pickupSlot: '11:00:00',
          status: 'PICKUP_SCHEDULED'
        })
      });
    });

    it('does NOT share pickup requestId if the pickup location names are different', async () => {
      // Setup finding the Delivery to reschedule
      const deliveryToReschedule = JSON.parse(JSON.stringify(mockDelivery));
      deliveryToReschedule.pickupRequestId = 'PR_OLD';
      
      // Setup an existing pickup but with a different seller location
      const existingSharedPickup = JSON.parse(JSON.stringify(mockDelivery));
      existingSharedPickup.id = 'del_999';
      existingSharedPickup.pickupRequestId = 'PR_SHARED';
      existingSharedPickup.pickupDate = '2026-09-26';
      existingSharedPickup.pickupSlot = '11:00:00';
      existingSharedPickup.status = 'PICKUP_SCHEDULED';
      existingSharedPickup.order.shop.seller.pickupLocationName = 'Different Warehouse';

      mockPrisma.delivery.findFirst.mockImplementation(async ({ where }) => {
        // Find existing shared pickup
        if (where && where.id && where.id.not) {
           // We pass seller.pickupLocationName = 'Cravo Artisans'. The DB has 'Different Warehouse'
           // This means the WHERE clause should technically not match. 
           // Since we mock the DB, we just return null to simulate that Prisma found no match.
           return null;
        }
        return deliveryToReschedule; // find delivery to reschedule
      });

      mockPrisma.delivery.findMany.mockResolvedValueOnce([]); // old pickup is not shared

      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true } // cancel old pickup
      });
      axiosPostSpy.mockResolvedValueOnce({
        data: {
          pickup_id: 'PR_NEW',
          pickup_date: '2026-09-26',
          pickup_time: '11:00:00'
        }
      });

      await deliveryService.reschedulePickup('del_123', sellerActor, {
        pickupDate: '2026-09-26',
        pickupTime: '11:00:00'
      });

      // Verify the new active pickup was CREATED, hitting the API!
      expect(axiosPostSpy).toHaveBeenCalledTimes(2); // cancel + create
      expect(axiosPostSpy.mock.calls[1][0]).toBe('/fm/request/new/');
      
      expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'del_123' },
        data: expect.objectContaining({
          pickupRequestId: 'PR_NEW'
        })
      });
    });

    it('rejects invalid pickup date formats or past dates', async () => {
      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2020-01-01'
        })
      ).rejects.toThrow('pickupDate cannot be in the past');

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '27-09-2026'
        })
      ).rejects.toThrow('Invalid pickupDate format');
    });

    it('rejects dates beyond 7 days in the future', async () => {
      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 15);
      const dateStr = farFutureDate.toISOString().split('T')[0];

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: dateStr
        })
      ).rejects.toThrow('pickupDate cannot be scheduled more than 7 days in advance');
    });

    it('rejects invalid pickup time formats', async () => {
      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26',
          pickupTime: '2 PM'
        })
      ).rejects.toThrow('Invalid pickupTime format');
    });
  });

  describe('4. Non-Atomic Rescheduling Recovery Paths', () => {
    it('recovers safely when old cancellation succeeds but new creation fails', async () => {
      // Old cancel succeeds
      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true }
      });
      // New creation fails
      axiosPostSpy.mockRejectedValueOnce(
        new Error('Warehouse unserviceable for selected date')
      );

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toThrow('Warehouse unserviceable for selected date');

      // Crucial Recovery: Delivery is safely reset to BOOKED with null pickup fields!
      expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del_123' },
          data: expect.objectContaining({
            status: 'BOOKED',
            pickupRequestId: null,
            pickupDate: null,
            pickupSlot: null
          })
        })
      );

      // Audit log records the partial failure recovery
      expect(mockPrisma.orderShipmentLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'Pickup Reschedule Incomplete'
          })
        })
      );
    });

    it('handles ambiguous timeout on old cancellation without creating duplicate new pickup', async () => {
      const timeoutErr = new Error('Gateway Timeout');
      timeoutErr.code = 'ECONNABORTED';
      axiosPostSpy.mockRejectedValueOnce(timeoutErr);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'DELHIVERY_PICKUP_CANCEL_TIMEOUT',
        isAmbiguous: true
      });

      // Enqueued for reconciliation
      expect(mockReconciliationQueue.add).toHaveBeenCalledWith(
        'reconcile-pickup',
        expect.objectContaining({
          deliveryId: 'del_123',
          pickupId: 'PR_1001',
          reason: 'OLD_CANCEL_TIMEOUT'
        })
      );

      // Second request (new creation) must NOT have been called!
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('handles ambiguous timeout on new pickup creation and enqueues to reconciliationQueue', async () => {
      // Old cancel succeeds
      axiosPostSpy.mockResolvedValueOnce({
        data: { status: true }
      });
      // New creation times out
      const timeoutErr = new Error('Connection reset');
      timeoutErr.code = 'ETIMEDOUT';
      axiosPostSpy.mockRejectedValueOnce(timeoutErr);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'DELHIVERY_PICKUP_SCHEDULE_TIMEOUT',
        isAmbiguous: true
      });

      // Enqueued for reconciliation
      expect(mockReconciliationQueue.add).toHaveBeenCalledWith(
        'reconcile-pickup',
        expect.objectContaining({
          deliveryId: 'del_123',
          sellerId: 'seller_1',
          reason: 'NEW_CREATION_TIMEOUT'
        })
      );
    });
  });

  describe('5. Concurrency & Idempotency Locking', () => {
    it('blocks concurrent pickup operations via process-local lock when Redis is unavailable', async () => {
      mockRedis.isOpen = false;
      try {
        // Simulate slow Delhivery response
        axiosPostSpy.mockImplementationOnce(() => new Promise((resolve) => {
          setTimeout(() => resolve({ data: { status: true } }), 100);
        }));

        const op1 = deliveryService.cancelPickup('del_123', sellerActor);
        const op2 = deliveryService.cancelPickup('del_123', sellerActor);

        const [res1, err2] = await Promise.allSettled([op1, op2]);

        expect(res1.status).toBe('fulfilled');
        expect(err2.status).toBe('rejected');
        expect(err2.reason.code).toBe('CONCURRENT_OPERATION');
        expect(err2.reason.message).toContain('Another pickup operation is currently in progress');
      } finally {
        mockRedis.isOpen = true;
      }
    });

    it('blocks concurrent pickup operations via Redis distributed lock across multiple backend instances', async () => {
      // Simulate another Cravo backend instance holding the Redis lock (SET NX returns null)
      mockRedis.set.mockResolvedValueOnce(null);

      await expect(
        deliveryService.cancelPickup('del_123', sellerActor)
      ).rejects.toMatchObject({
        code: 'CONCURRENT_OPERATION',
        message: expect.stringContaining('Another pickup operation is currently in progress')
      });

      // Assert that Delhivery API and DB update are NEVER reached
      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    });

    it('blocks concurrent reschedule operations via Redis distributed lock across multiple backend instances', async () => {
      mockRedis.set.mockResolvedValueOnce(null);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'CONCURRENT_OPERATION',
        message: expect.stringContaining('Another pickup operation is currently in progress')
      });

      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    });
  });

  describe('6. FAILED State Clarification & Invalid FAILED Scenarios', () => {
    it('allows pickup reschedule on FAILED delivery if trackingNumber exists and no courier dispatch has occurred', async () => {
      const failedPickupDelivery = {
        ...mockDelivery,
        status: 'FAILED',
        pickedUpAt: null,
        shippedAt: null,
        pickupRequestId: null,
        pickupDate: null,
        pickupSlot: null
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(failedPickupDelivery);

      axiosPostSpy.mockResolvedValueOnce({
        data: {
          pickup_id: 'PR_RETRY_1',
          pickup_date: '2026-09-26',
          pickup_time: '12:00:00'
        }
      });

      const res = await deliveryService.reschedulePickup('del_123', sellerActor, {
        pickupDate: '2026-09-26'
      });

      expect(res.success).toBe(true);
      expect(res.deliveryStatus).toBe('PICKUP_SCHEDULED');
      expect(res.pickupRequestId).toBe('PR_RETRY_1');
    });

    it('rejects pickup reschedule on FAILED delivery without trackingNumber (shipment creation failure)', async () => {
      const failedShipmentDelivery = {
        ...mockDelivery,
        status: 'FAILED',
        trackingNumber: null,
        pickupRequestId: null
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(failedShipmentDelivery);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toThrow('Shipment must exist before scheduling or retrying pickup');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects pickup reschedule on FAILED delivery if package was already dispatched (pickedUpAt timestamp set)', async () => {
      const postDispatchDelivery = {
        ...mockDelivery,
        status: 'FAILED',
        pickedUpAt: new Date(),
        pickupRequestId: null
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(postDispatchDelivery);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'POST_DISPATCH_FAILURE',
        message: expect.stringContaining('This shipment has already been picked up from the warehouse')
      });

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects pickup reschedule on FAILED delivery if package was already in transit (shippedAt timestamp set)', async () => {
      const postDispatchDelivery = {
        ...mockDelivery,
        status: 'FAILED',
        shippedAt: new Date(),
        pickupRequestId: null
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(postDispatchDelivery);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'POST_DISPATCH_FAILURE',
        message: expect.stringContaining('This shipment has already been picked up from the warehouse')
      });

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects pickup cancel on FAILED delivery if package was already dispatched (pickedUpAt timestamp set)', async () => {
      const postDispatchDelivery = {
        ...mockDelivery,
        status: 'FAILED',
        pickedUpAt: new Date(),
        pickupRequestId: 'PR_1001'
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(postDispatchDelivery);

      await expect(
        deliveryService.cancelPickup('del_123', sellerActor)
      ).rejects.toMatchObject({
        code: 'SHIPMENT_IN_TRANSIT',
        message: expect.stringContaining('Pickup cannot be cancelled after courier pickup has already occurred')
      });

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects pickup operations on CANCELLED deliveries', async () => {
      const cancelledDelivery = {
        ...mockDelivery,
        status: 'CANCELLED',
        pickupRequestId: 'PR_1001'
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(cancelledDelivery);

      await expect(
        deliveryService.cancelPickup('del_123', sellerActor)
      ).rejects.toMatchObject({
        code: 'INVALID_DELIVERY_STATUS',
        message: expect.stringContaining('Cannot cancel pickup when delivery status is CANCELLED')
      });

      mockPrisma.delivery.findFirst.mockResolvedValueOnce(cancelledDelivery);

      await expect(
        deliveryService.reschedulePickup('del_123', sellerActor, {
          pickupDate: '2026-09-26'
        })
      ).rejects.toMatchObject({
        code: 'INVALID_DELIVERY_STATUS',
        message: expect.stringContaining('Cannot reschedule pickup when delivery status is CANCELLED')
      });

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });
  });
});
