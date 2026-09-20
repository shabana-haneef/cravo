import { jest } from '@jest/globals';
import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';

// Setup environment
process.env.DELHIVERY_API_TOKEN = 'test_delhivery_token_ewaybill';
process.env.DELHIVERY_ENV = 'prod';

// Mock Redis
const mockRedis = {
  isOpen: true,
  get: jest.fn(),
  setEx: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  on: jest.fn(),
  duplicate: jest.fn().mockReturnValue({ on: jest.fn() })
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

describe('Delhivery E-Waybill Update API Architecture', () => {
  let axiosPutSpy;

  const mockSeller = {
    id: 'seller_1',
    userId: 'seller_user_1',
    businessName: 'Cravo Artisans'
  };

  const mockOrder = {
    id: 'order_1',
    orderNumber: 'ORD-2026-9999',
    invoiceNumber: 'INV-2026-9999',
    customerId: 'customer_1',
    shopId: 'shop_1',
    status: 'READY_FOR_PICKUP',
    shipmentLogs: [],
    shop: {
      id: 'shop_1',
      sellerId: 'seller_1',
      seller: mockSeller
    }
  };

  const mockDelivery = {
    id: 'del_123',
    orderId: 'order_1',
    trackingNumber: '56047210000571',
    delhiveryShipmentId: 'DEL_SHP_999',
    status: 'READY_FOR_PICKUP',
    ewaybillNumber: null,
    returnEwaybillNumber: null,
    order: mockOrder
  };

  const sellerActor = { id: 'seller_user_1', userId: 'seller_user_1', role: 'SELLER', sellerId: 'seller_1' };
  const strangerActor = { id: 'other_user', userId: 'other_user', role: 'SELLER', sellerId: 'seller_999' };
  const adminActor = { id: 'admin_1', userId: 'admin_1', role: 'ADMIN' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);

    mockPrisma.delivery.findFirst.mockResolvedValue({ ...mockDelivery });
    mockPrisma.delivery.findUnique.mockResolvedValue({ ...mockDelivery });
    mockPrisma.delivery.update.mockImplementation(async ({ data }) => ({
      ...mockDelivery,
      ...data
    }));
    mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder });
    mockPrisma.order.update.mockResolvedValue({ ...mockOrder });

    axiosPutSpy = jest.spyOn(axios.Axios.prototype, 'put').mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: [{ dcn: 'INV-2026-9999', ewbn: '121456789012' }],
        message: 'E-Waybill updated successfully'
      }
    });
  });

  afterEach(() => {
    if (axiosPutSpy) axiosPutSpy.mockRestore();
  });

  describe('1. Input Validation Rules (Cravo Domain)', () => {
    it('rejects missing or empty dcn with 400 INVALID_DCN', async () => {
      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: '', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Invoice / Document Number (dcn) is required');

      expect(axiosPutSpy).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    });

    it('rejects dcn exceeding 50 characters with 400 INVALID_DCN', async () => {
      const longDcn = 'A'.repeat(51);
      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: longDcn, ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('cannot exceed 50 characters');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });

    it('rejects missing or empty ewbn with 400 INVALID_EWBN', async () => {
      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-12345', ewbn: '   ' }, sellerActor)
      ).rejects.toThrow('E-Waybill Number (ewbn) is required');

      expect(axiosPutSpy).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    });

    it('rejects ewbn exceeding 50 characters with 400 INVALID_EWBN', async () => {
      const longEwbn = '9'.repeat(51);
      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-12345', ewbn: longEwbn }, sellerActor)
      ).rejects.toThrow('cannot exceed 50 characters');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });

    it('rejects missing deliveryIdOrOrderId with 400', async () => {
      await expect(
        deliveryService.updateEwaybill('', { dcn: 'INV-12345', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Delivery ID or Order ID is required');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });
  });

  describe('2. Authorization & Permissions', () => {
    it('rejects unauthenticated requests with 401', async () => {
      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, null)
      ).rejects.toThrow('Authentication required');
    });

    it('rejects another seller from updating an unowned delivery with 403', async () => {
      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, strangerActor)
      ).rejects.toThrow('Unauthorized: You do not have permission');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });

    it('allows the owning seller to update their delivery e-waybill', async () => {
      const result = await deliveryService.updateEwaybill(
        'del_123',
        { dcn: 'INV-2026-9999', ewbn: '121456789012' },
        sellerActor
      );

      expect(result.success).toBe(true);
      expect(result.flow).toBe('FORWARD');
      expect(result.ewbn).toBe('121456789012');
      expect(axiosPutSpy).toHaveBeenCalledTimes(1);
    });

    it('allows an ADMIN to update any delivery e-waybill', async () => {
      const result = await deliveryService.updateEwaybill(
        'del_123',
        { dcn: 'INV-2026-9999', ewbn: '121456789012' },
        adminActor
      );

      expect(result.success).toBe(true);
      expect(axiosPutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. AWB Resolution & State Machine Boundaries', () => {
    it('resolves Delivery by orderId as well as deliveryId', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({ ...mockDelivery });
      const result = await deliveryService.updateEwaybill(
        'order_1',
        { dcn: 'INV-2026-9999', ewbn: '121456789012' },
        sellerActor
      );

      expect(result.success).toBe(true);
      expect(result.waybill).toBe('56047210000571');
    });

    it('throws 404 if delivery record does not exist', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(null);
      mockPrisma.delivery.findUnique.mockResolvedValue(null);

      await expect(
        deliveryService.updateEwaybill('nonexistent', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Delivery record not found');
    });

    it('rejects unmanifested shipment (no trackingNumber) with 400 SHIPMENT_NOT_MANIFESTED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({
        ...mockDelivery,
        trackingNumber: null,
        status: 'CREATING'
      });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        ...mockDelivery,
        trackingNumber: null,
        status: 'CREATING'
      });

      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Cannot update e-waybill for an unmanifested shipment');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });

    it('blocks e-waybill updates for CANCELLED delivery with 400 SHIPMENT_CANCELLED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({ ...mockDelivery, status: 'CANCELLED' });
      mockPrisma.delivery.findUnique.mockResolvedValue({ ...mockDelivery, status: 'CANCELLED' });

      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Cannot update e-waybill for a cancelled shipment');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });

    it('blocks e-waybill updates for DELIVERED delivery with 400 SHIPMENT_ALREADY_DELIVERED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({ ...mockDelivery, status: 'DELIVERED' });
      mockPrisma.delivery.findUnique.mockResolvedValue({ ...mockDelivery, status: 'DELIVERED' });

      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Cannot update e-waybill for an already delivered shipment');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });

    it('allows updates for active forward states: BOOKED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, NDR', async () => {
      const activeStates = ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NDR'];

      for (const st of activeStates) {
        mockPrisma.delivery.findFirst.mockResolvedValue({ ...mockDelivery, status: st });
        mockPrisma.delivery.findUnique.mockResolvedValue({ ...mockDelivery, status: st });

        const res = await deliveryService.updateEwaybill(
          'del_123',
          { dcn: 'INV-123', ewbn: `12145678901${st.length}` },
          sellerActor
        );
        expect(res.success).toBe(true);
        expect(res.flow).toBe('FORWARD');
      }
    });
  });

  describe('4. Forward vs Return / RTO Separation', () => {
    it('persists forward e-waybill to Delivery.ewaybillNumber during forward flow', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({ ...mockDelivery, status: 'IN_TRANSIT' });
      mockPrisma.delivery.findUnique.mockResolvedValue({ ...mockDelivery, status: 'IN_TRANSIT' });

      const res = await deliveryService.updateEwaybill(
        'del_123',
        { dcn: 'INV-FORWARD', ewbn: '998877665544' },
        sellerActor
      );

      expect(res.success).toBe(true);
      expect(res.flow).toBe('FORWARD');
      expect(res.ewaybillNumber).toBe('998877665544');

      expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del_123' },
          data: expect.objectContaining({
            ewaybillNumber: '998877665544'
          })
        })
      );
    });

    it('persists return e-waybill to Delivery.returnEwaybillNumber during RTO / RETURNED flow', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({
        ...mockDelivery,
        status: 'RTO',
        ewaybillNumber: 'FORWARD_EWB_111'
      });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        ...mockDelivery,
        status: 'RTO',
        ewaybillNumber: 'FORWARD_EWB_111'
      });

      const res = await deliveryService.updateEwaybill(
        'del_123',
        { dcn: 'INV-RETURN-01', ewbn: 'RET8877665544' },
        sellerActor
      );

      expect(res.success).toBe(true);
      expect(res.flow).toBe('RETURN');
      expect(res.returnEwaybillNumber).toBe('RET8877665544');
      expect(res.ewaybillNumber).toBe('FORWARD_EWB_111'); // Forward remains unchanged!

      expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del_123' },
          data: expect.objectContaining({
            returnEwaybillNumber: 'RET8877665544'
          })
        })
      );
    });
  });

  describe('5. External Delhivery Call & Request Structure', () => {
    it('constructs correct PUT endpoint and payload format for Delhivery', async () => {
      await deliveryService.updateEwaybill(
        'del_123',
        { dcn: 'INV-DOC-42', ewbn: '123456789012' },
        sellerActor
      );

      expect(axiosPutSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/rest/ewaybill/56047210000571/'),
        {
          data: [
            {
              dcn: 'INV-DOC-42',
              ewbn: '123456789012'
            }
          ]
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('maps Delhivery 429 rate limit response to DELHIVERY_RATE_LIMITED', async () => {
      axiosPutSpy.mockRejectedValueOnce({
        response: { status: 429, data: { error: 'Rate limit exceeded: 250 requests / 5 minutes' } }
      });

      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Delhivery E-Waybill Update error');
    });
  });

  describe('6. Sequential Duplicate Submissions (Idempotency)', () => {
    it('returns idempotent success without calling Delhivery if e-waybill is already identical', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({
        ...mockDelivery,
        status: 'READY_FOR_PICKUP',
        ewaybillNumber: '121456789012'
      });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        ...mockDelivery,
        status: 'READY_FOR_PICKUP',
        ewaybillNumber: '121456789012'
      });

      const res = await deliveryService.updateEwaybill(
        'del_123',
        { dcn: 'INV-2026-9999', ewbn: '121456789012' },
        sellerActor
      );

      expect(res.success).toBe(true);
      expect(res.alreadyUpdated).toBe(true);
      expect(axiosPutSpy).not.toHaveBeenCalled();
    });
  });

  describe('7. Concurrency & Redis Distributed Locking', () => {
    it('blocks simultaneous operations on the same delivery with 409 CONCURRENT_OPERATION', async () => {
      mockRedis.set.mockResolvedValueOnce(null); // Lock acquisition fails (already locked)

      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toThrow('Another e-waybill update operation is currently in progress');

      expect(axiosPutSpy).not.toHaveBeenCalled();
    });
  });

  describe('8. Ambiguous Timeout & Non-Blind Retries', () => {
    it('flags ambiguous timeout, records IntegrationLog, enqueues reconciliation, and does NOT retry', async () => {
      const timeoutError = new Error('Gateway timeout on Delhivery API');
      timeoutError.code = 'ECONNABORTED';
      axiosPutSpy.mockRejectedValueOnce(timeoutError);

      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toMatchObject({
        isAmbiguous: true,
        statusCode: 504,
        errorCode: 'DELHIVERY_EWAYBILL_TIMEOUT'
      });

      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'EWAYBILL_UPDATE_TIMEOUT',
            status: 'AMBIGUOUS_TIMEOUT'
          })
        })
      );

      expect(mockReconciliationQueue.add).toHaveBeenCalledWith(
        'reconcile-ewaybill',
        expect.objectContaining({
          deliveryId: 'del_123',
          waybill: '56047210000571',
          reason: 'AMBIGUOUS_TIMEOUT'
        })
      );

      // Verify no blind retry occurred (only 1 call)
      expect(axiosPutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('9. Post-Delhivery DB Failure Handling (NEEDS_RECONCILIATION)', () => {
    it('flags NEEDS_RECONCILIATION and enqueues to reconciliationQueue when local DB update fails after Delhivery success', async () => {
      mockPrisma.delivery.update.mockRejectedValueOnce(new Error('Postgres connection dead during delivery update'));

      await expect(
        deliveryService.updateEwaybill('del_123', { dcn: 'INV-123', ewbn: '121456789012' }, sellerActor)
      ).rejects.toMatchObject({
        errorCode: 'POST_DELHIVERY_DB_SYNC_FAILED',
        meta: expect.objectContaining({
          waybill: '56047210000571',
          updatedOnDelhivery: true
        })
      });

      // External call was made exactly once
      expect(axiosPutSpy).toHaveBeenCalledTimes(1);

      // IntegrationLog flagged NEEDS_RECONCILIATION
      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'EWAYBILL_UPDATE_DB_FAILED',
            status: 'NEEDS_RECONCILIATION'
          })
        })
      );

      // Added to reconciliation queue
      expect(mockReconciliationQueue.add).toHaveBeenCalledWith(
        'reconcile-ewaybill',
        expect.objectContaining({
          deliveryId: 'del_123',
          waybill: '56047210000571',
          reason: 'POST_DELHIVERY_DB_SYNC_FAILED'
        })
      );
    });
  });

  describe('10. System Invariants', () => {
    it('preserves all logistics invariants: AWB, status, inventory, and no DeliveryTrackingEvent', async () => {
      await deliveryService.updateEwaybill(
        'del_123',
        { dcn: 'INV-DOC-42', ewbn: '121456789012' },
        sellerActor
      );

      // AWB remains unchanged
      expect(mockPrisma.delivery.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trackingNumber: expect.anything()
          })
        })
      );

      // Status remains unchanged
      expect(mockPrisma.delivery.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: expect.anything()
          })
        })
      );

      // No DeliveryTrackingEvent created
      expect(mockPrisma.deliveryTrackingEvent.create).not.toHaveBeenCalled();

      // No waybill inventory modification
      expect(mockPrisma.delhiveryWaybill.updateMany).not.toHaveBeenCalled();

      // Audit logs created
      expect(mockPrisma.orderShipmentLog.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'EWAYBILL_UPDATE',
            status: 'SUCCESS'
          })
        })
      );
    });
  });
});
