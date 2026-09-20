import { jest } from '@jest/globals';
import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';

// Setup environment
process.env.DELHIVERY_API_TOKEN = 'test_delhivery_token_cancel';
process.env.DELHIVERY_ENV = 'prod';

// Mock Redis
const mockRedis = {
  isOpen: true,
  get: jest.fn(),
  setEx: jest.fn(),
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
  initiateRefund: jest.fn().mockResolvedValue({
    id: 'ref_123',
    status: 'PENDING',
    amount: 1500,
    razorpayRefundId: 'rfnd_rzp_123'
  })
};

await jest.unstable_mockModule('../../payments/services/refund.service.js', () => ({
  refundService: mockRefundService
}));

// Mock orderSettingsService
const mockOrderSettingsService = {
  get: jest.fn().mockResolvedValue({
    allowCustomerCancellation: true,
    customerCancellationWindowMins: 30
  })
};

await jest.unstable_mockModule('../../admin/services/orderSettings.service.js', () => ({
  orderSettingsService: mockOrderSettingsService
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
    update: jest.fn()
  },
  order: {
    findUnique: jest.fn(),
    update: jest.fn().mockResolvedValue({})
  },
  inventory: {
    findUnique: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 })
  },
  inventoryTransaction: {
    create: jest.fn().mockResolvedValue({})
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

describe('Delhivery Shipment Cancellation API (POST /api/p/edit with cancellation: "true")', () => {
  let axiosPostSpy;

  const mockOrder = {
    id: 'ord_123',
    orderNumber: 'ORD-12345',
    customerId: 'cust_123',
    status: 'SELLER_ACCEPTED',
    createdAt: new Date(),
    shippingLabelUrl: 'https://cdn.delhivery.com/label.pdf',
    items: [
      { productVariantId: 'var_1', quantity: 2 }
    ],
    payments: [
      { id: 'pay_123', amount: 1500, status: 'SUCCESS', razorpayPaymentId: 'pay_rzp_123' }
    ],
    shop: {
      id: 'shop_1',
      sellerId: 'seller_1',
      seller: {
        id: 'seller_1',
        userId: 'seller_user_1'
      }
    }
  };

  const mockDelivery = {
    id: 'del_123',
    orderId: 'ord_123',
    trackingNumber: '56047210000571',
    delhiveryShipmentId: 'ORD-12345',
    status: 'BOOKED',
    shippingLabelUrl: 'https://cdn.delhivery.com/label.pdf',
    order: mockOrder
  };

  const sellerActor = {
    id: 'seller_user_1',
    userId: 'seller_user_1',
    role: 'SELLER',
    sellerId: 'seller_1'
  };

  const adminActor = {
    id: 'admin_1',
    userId: 'admin_1',
    role: 'ADMIN'
  };

  const customerActor = {
    id: 'cust_123',
    userId: 'cust_123',
    role: 'CUSTOMER'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axiosPostSpy = jest.spyOn(axios.Axios.prototype, 'post').mockResolvedValue({
      data: { status: true, remark: 'Shipment cancelled successfully' }
    });

    mockPrisma.delivery.findFirst.mockResolvedValue(JSON.parse(JSON.stringify(mockDelivery)));
    mockPrisma.delivery.update.mockResolvedValue({ id: 'del_123', status: 'CANCELLED', shippingLabelUrl: null });
    mockPrisma.order.findUnique.mockResolvedValue(JSON.parse(JSON.stringify(mockOrder)));
    mockPrisma.order.update.mockResolvedValue({ id: 'ord_123', status: 'CANCELLED' });
    mockPrisma.inventory.findUnique.mockResolvedValue({ id: 'inv_1', availableStock: 10, reservedStock: 2 });
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
  });

  afterEach(() => {
    axiosPostSpy.mockRestore();
  });

  describe('1. Non-COD & Delhivery Payload Contract', () => {
    it('sends ONLY waybill and cancellation: "true" to POST /api/p/edit', async () => {
      const result = await delhiveryShipmentService.cancelShipment('56047210000571');

      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      const [url, payload] = axiosPostSpy.mock.calls[0];
      expect(url).toBe('/api/p/edit');
      expect(payload).toEqual({
        waybill: '56047210000571',
        cancellation: 'true'
      });
      expect(payload).not.toHaveProperty('cod');
      expect(result.success).toBe(true);
    });

    it('strictly rejects any request containing cod without calling Delhivery', async () => {
      await expect(
        deliveryService.cancelShipment('del_123', sellerActor, { cod: 500 })
      ).rejects.toThrow('Cravo does not support COD');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects cod when passed to delhiveryShipmentService directly', async () => {
      await expect(
        delhiveryShipmentService.cancelShipment('56047210000571', { cod: 100 })
      ).rejects.toThrow('Cravo does not support COD');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });
  });

  describe('2. Delivery State Machine Transitions & Restrictions', () => {
    it('successfully cancels pre-pickup BOOKED shipment', async () => {
      const result = await deliveryService.cancelShipment('del_123', sellerActor);

      expect(result.success).toBe(true);
      expect(result.status).toBe('CANCELLED');
      expect(result.deliveryStatus).toBe('CANCELLED');
      expect(result.orderStatus).toBe('CANCELLED');
      expect(result.waybillStatus).toBe('USED');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('successfully cancels CREATED, PICKUP_SCHEDULED, READY_FOR_PICKUP shipments', async () => {
      for (const validStatus of ['CREATED', 'PICKUP_SCHEDULED', 'READY_FOR_PICKUP']) {
        mockPrisma.delivery.findFirst.mockResolvedValueOnce({
          ...mockDelivery,
          status: validStatus
        });

        const result = await deliveryService.cancelShipment('del_123', sellerActor);
        expect(result.success).toBe(true);
        expect(result.status).toBe('CANCELLED');
      }
    });

    it('blocks cancellation for PICKED_UP shipments with 400 SHIPMENT_IN_TRANSIT', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status: 'PICKED_UP'
      });

      await expect(
        deliveryService.cancelShipment('del_123', sellerActor)
      ).rejects.toThrow('Shipment cannot be cancelled after courier pickup');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('blocks cancellation for IN_TRANSIT shipments with 400 SHIPMENT_IN_TRANSIT', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status: 'IN_TRANSIT'
      });

      await expect(
        deliveryService.cancelShipment('del_123', sellerActor)
      ).rejects.toThrow('Shipment cannot be cancelled after courier pickup');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('blocks cancellation for terminal statuses DELIVERED, OUT_FOR_DELIVERY, RETURNED, RTO', async () => {
      for (const terminalStatus of ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'RTO']) {
        mockPrisma.delivery.findFirst.mockResolvedValueOnce({
          ...mockDelivery,
          status: terminalStatus
        });

        await expect(
          deliveryService.cancelShipment('del_123', sellerActor)
        ).rejects.toThrow(`Shipment cannot be cancelled when delivery status is ${terminalStatus}`);

        expect(axiosPostSpy).not.toHaveBeenCalled();
      }
    });

    it('is idempotent for already CANCELLED shipments (returns 200 OK without Delhivery call)', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status: 'CANCELLED'
      });

      const result = await deliveryService.cancelShipment('del_123', sellerActor);

      expect(result.success).toBe(true);
      expect(result.alreadyCancelled).toBe(true);
      expect(result.status).toBe('CANCELLED');
      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(mockRefundService.initiateRefund).not.toHaveBeenCalled();
    });
  });

  describe('3. Pre-manifest & FAILED Delivery Handling', () => {
    it('handles NOT_CREATED / PENDING without calling Delhivery (local domain only)', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status: 'NOT_CREATED',
        trackingNumber: null
      });

      const result = await deliveryService.cancelShipment('del_123', sellerActor);

      expect(result.success).toBe(true);
      expect(result.localOnly).toBe(true);
      expect(result.status).toBe('CANCELLED');
      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(mockPrisma.inventory.updateMany).toHaveBeenCalled();
    });

    it('cancels purely local order when no Delivery row exists', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(null);
      mockPrisma.order.findUnique.mockResolvedValueOnce(mockOrder);

      const result = await deliveryService.cancelShipment('ord_123', sellerActor);

      expect(result.success).toBe(true);
      expect(result.localOnly).toBe(true);
      expect(result.status).toBe('CANCELLED');
      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_123' },
          data: expect.objectContaining({ status: 'CANCELLED' })
        })
      );
    });

    it('calls Delhivery if FAILED delivery has manifested trackingNumber', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status: 'FAILED',
        trackingNumber: '56047210000571'
      });

      const result = await deliveryService.cancelShipment('del_123', sellerActor);

      expect(result.success).toBe(true);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT call Delhivery if FAILED delivery has no trackingNumber', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status: 'FAILED',
        trackingNumber: null
      });

      const result = await deliveryService.cancelShipment('del_123', sellerActor);

      expect(result.success).toBe(true);
      expect(result.localOnly).toBe(true);
      expect(axiosPostSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Stock Reservation & Double-Release Prevention', () => {
    it('releases reserved stock atomically using ORDER_RELEASED transaction', async () => {
      await deliveryService.cancelShipment('del_123', sellerActor);

      expect(mockPrisma.inventory.updateMany).toHaveBeenCalledWith({
        where: {
          productVariantId: 'var_1',
          reservedStock: { gte: 2 }
        },
        data: {
          availableStock: { increment: 2 },
          reservedStock: { decrement: 2 }
        }
      });

      expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'ORDER_RELEASED',
          quantity: 2
        })
      });
    });

    it('prevents double stock release if order was already CANCELLED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        order: {
          ...mockOrder,
          status: 'CANCELLED'
        }
      });

      await deliveryService.cancelShipment('del_123', sellerActor);

      // Inventory update should be skipped for already-cancelled orders
      expect(mockPrisma.inventory.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('5. Refund Orchestration Outside DB Transaction', () => {
    it('initiates refund after DB transaction commits and returns refund status', async () => {
      const result = await deliveryService.cancelShipment('del_123', sellerActor);

      expect(mockRefundService.initiateRefund).toHaveBeenCalledTimes(1);
      expect(mockRefundService.initiateRefund).toHaveBeenCalledWith(
        'pay_123',
        1500,
        expect.any(String),
        'refund-cancel-ord_123'
      );
      expect(result.refund).toEqual({ id: 'ref_123', status: 'PENDING' });
    });

    it('does not roll back DB transaction if refundService throws an error', async () => {
      mockRefundService.initiateRefund.mockRejectedValueOnce(new Error('Gateway timeout'));

      const result = await deliveryService.cancelShipment('del_123', sellerActor);

      // Delivery is still cancelled in database
      expect(result.success).toBe(true);
      expect(result.status).toBe('CANCELLED');
      expect(result.refund).toBeNull();
      expect(mockPrisma.delivery.update).toHaveBeenCalled();
    });
  });

  describe('6. DelhiveryWaybill Lifecycle Invariance', () => {
    it('ensures DelhiveryWaybill is NEVER reset to AVAILABLE', async () => {
      await deliveryService.cancelShipment('del_123', sellerActor);

      // Check all waybill update calls
      const waybillCalls = mockPrisma.delhiveryWaybill.updateMany.mock.calls;
      for (const call of waybillCalls) {
        if (call[0]?.data?.status) {
          expect(call[0].data.status).not.toBe('AVAILABLE');
        }
      }
    });
  });

  describe('7. No DeliveryTrackingEvent Invariance', () => {
    it('does NOT create DeliveryTrackingEvent for shipment cancellation', async () => {
      await deliveryService.cancelShipment('del_123', sellerActor);

      expect(mockPrisma.deliveryTrackingEvent.create).not.toHaveBeenCalled();
      expect(mockPrisma.orderShipmentLog.create).toHaveBeenCalled();
      expect(mockPrisma.integrationLog.create).toHaveBeenCalled();
    });
  });

  describe('8. Ambiguous Timeout & Post-Delhivery DB Failure Recovery', () => {
    it('handles ambiguous timeout without blind retry and logs AMBIGUOUS_TIMEOUT', async () => {
      const timeoutError = new Error('Gateway timeout');
      timeoutError.code = 'ECONNABORTED';
      axiosPostSpy.mockRejectedValueOnce(timeoutError);

      await expect(
        deliveryService.cancelShipment('del_123', sellerActor)
      ).rejects.toThrow('Delhivery Shipment Cancellation error');

      expect(axiosPostSpy).toHaveBeenCalledTimes(1); // No blind retry!
      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          service: 'Delhivery',
          status: 'AMBIGUOUS_TIMEOUT'
        })
      });
    });

    it('handles post-Delhivery DB failure by enqueuing reconciliation and creating NEEDS_RECONCILIATION log', async () => {
      // Delhivery succeeds, but DB transaction throws
      mockPrisma.$transaction.mockRejectedValueOnce(new Error('DB connection killed'));

      await expect(
        deliveryService.cancelShipment('del_123', sellerActor)
      ).rejects.toMatchObject({
        errorCode: 'POST_DELHIVERY_DB_SYNC_FAILED'
      });

      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          service: 'Delhivery',
          event: 'SHIPMENT_CANCEL_DB_FAILED',
          status: 'NEEDS_RECONCILIATION'
        })
      });

      expect(mockReconciliationQueue.add).toHaveBeenCalledWith(
        'reconcile-cancelled-shipment',
        expect.objectContaining({
          waybill: '56047210000571',
          reason: 'POST_DELHIVERY_DB_SYNC_FAILED'
        })
      );
    });
  });

  describe('9. Authorization & Customer Cancellation Rules', () => {
    it('allows ADMIN to cancel any shipment', async () => {
      const result = await deliveryService.cancelShipment('del_123', adminActor);
      expect(result.success).toBe(true);
    });

    it('rejects unauthorized seller who does not own the order', async () => {
      const strangerSeller = {
        id: 'seller_other',
        userId: 'seller_other',
        role: 'SELLER',
        sellerId: 'seller_other'
      };

      await expect(
        deliveryService.cancelShipment('del_123', strangerSeller)
      ).rejects.toThrow('Unauthorized');
    });

    it('allows CUSTOMER within cancellation window', async () => {
      const result = await deliveryService.cancelShipment('del_123', customerActor);
      expect(result.success).toBe(true);
    });

    it('rejects CUSTOMER if customer cancellation is disabled in settings', async () => {
      mockOrderSettingsService.get.mockResolvedValueOnce({
        allowCustomerCancellation: false,
        customerCancellationWindowMins: 30
      });

      await expect(
        deliveryService.cancelShipment('del_123', customerActor)
      ).rejects.toThrow('Customer cancellation is disabled');
    });

    it('rejects CUSTOMER if cancellation window has expired', async () => {
      // Created 60 mins ago
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        order: {
          ...mockOrder,
          createdAt: new Date(Date.now() - 60 * 60 * 1000)
        }
      });

      await expect(
        deliveryService.cancelShipment('del_123', customerActor)
      ).rejects.toThrow('Cancellation window of 30 minutes has expired');
    });
  });
});
