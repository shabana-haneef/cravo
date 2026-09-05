import { jest } from '@jest/globals';
import { deliveryService } from '../services/delivery.service.js';
import { delhiveryShipmentService } from '../services/delhiveryShipmentService.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { startReconciliationJob } from '../jobs/reconciliation.job.js';

const mockPrisma = {
  delivery: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  },
  order: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  seller: {
    findUnique: jest.fn()
  },
  deliveryTrackingEvent: {
    create: jest.fn()
  },
  $transaction: jest.fn(async (callback) => {
    return callback(mockPrisma);
  })
};

jest.mock('../../../lib/prisma.js', () => {
  return {
    __esModule: true,
    default: mockPrisma
  };
});

jest.mock('../services/delhiveryShipmentService.js', () => {
  return {
    delhiveryShipmentService: {
      findShipmentByOrderNumber: jest.fn(),
      createShipment: jest.fn(),
      createPickupRequest: jest.fn(),
      generateShippingLabel: jest.fn(),
      trackShipment: jest.fn()
    }
  };
});

jest.mock('../../../shared/utils/queue.manager.js', () => {
  const queueAdd = jest.fn().mockResolvedValue(true);
  return {
    createQueue: jest.fn(() => ({
      add: queueAdd
    })),
    createWorker: jest.fn()
  };
});

describe('Seller Fulfillment Workflow - Production Readiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Delhivery Shipment Recovery', () => {
    it('reuses existing shipment if Cravo DB fails initially', async () => {
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1' } } };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      
      // Simulate existing shipment on Delhivery
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue({ trackingNumber: 'AWB123', status: 'BOOKED' });
      
      // Mock createPickupRequest
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({ pickupId: 'P123', pickupDate: '2026-09-06', pickupTime: '10:00' });
      delhiveryShipmentService.generateShippingLabel.mockResolvedValue('http://label');

      await deliveryService.initiateDelivery('order_1');

      expect(delhiveryShipmentService.createShipment).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('creates new shipment if none exists', async () => {
      const order = { id: 'order_2', orderNumber: 'ORD-124', address: {}, shop: { seller: { pickupLocationName: 'Loc1' } } };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB124', shipmentId: 'SHP124' });
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({ pickupId: 'P124', pickupDate: '2026-09-06', pickupTime: '10:00' });
      delhiveryShipmentService.generateShippingLabel.mockResolvedValue('http://label');

      await deliveryService.initiateDelivery('order_2');

      expect(delhiveryShipmentService.createShipment).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('2. Shipment Retry', () => {
    it('retries FAILED shipment and updates state correctly', async () => {
      const mockDelivery = { status: 'FAILED', order: { shop: { sellerId: 'seller_1' } } };
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.seller.findUnique.mockResolvedValue({ id: 'seller_1', userId: 'user_1' });
      
      const order = { id: 'order_1', orderNumber: 'ORD-123', address: {}, shop: { seller: { pickupLocationName: 'Loc1' } } };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      
      delhiveryShipmentService.findShipmentByOrderNumber.mockResolvedValue(null);
      delhiveryShipmentService.createShipment.mockResolvedValue({ success: true, trackingNumber: 'AWB123', shipmentId: 'SHP123' });
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({});

      await deliveryService.retryShipment('order_1', 'user_1');
      expect(delhiveryShipmentService.createShipment).toHaveBeenCalled();
    });

    it('fails if shipment is not FAILED', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ status: 'CREATED', order: { shop: { sellerId: 'seller_1' } } });
      await expect(deliveryService.retryShipment('order_1', 'user_1')).rejects.toThrow('Only failed shipments can be retried');
    });
  });

  describe('3. Label Retry', () => {
    it('retries label generation and updates DB', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', shippingLabelUrl: null, order: { shop: { sellerId: 'seller_1' } } });
      mockPrisma.seller.findUnique.mockResolvedValue({ id: 'seller_1', userId: 'user_1' });
      delhiveryShipmentService.generateShippingLabel.mockResolvedValue('http://newlabel');

      const result = await deliveryService.retryLabel('order_1', 'user_1');
      expect(result.shippingLabelUrl).toBe('http://newlabel');
      expect(mockPrisma.delivery.update).toHaveBeenCalled();
    });

    it('fails if label already exists', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', shippingLabelUrl: 'http://existing', order: { shop: { sellerId: 'seller_1' } } });
      await expect(deliveryService.retryLabel('order_1', 'user_1')).rejects.toThrow('Label is already generated');
    });
  });

  describe('4. Pickup Retry', () => {
    it('retries pickup scheduling and updates DB', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', pickupRequestId: null, order: { shop: { sellerId: 'seller_1', seller: {} } } });
      mockPrisma.seller.findUnique.mockResolvedValue({ id: 'seller_1', userId: 'user_1' });
      delhiveryShipmentService.createPickupRequest.mockResolvedValue({ pickupId: 'P123', pickupDate: '2026-09-06', pickupTime: '10:00' });

      const result = await deliveryService.retryPickup('order_1', 'user_1');
      expect(result.pickupData.pickupId).toBe('P123');
      expect(mockPrisma.delivery.update).toHaveBeenCalled();
    });

    it('fails if pickup already scheduled', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ trackingNumber: 'AWB123', pickupRequestId: 'P123', order: { shop: { sellerId: 'seller_1' } } });
      await expect(deliveryService.retryPickup('order_1', 'user_1')).rejects.toThrow('Pickup is already scheduled');
    });
  });

  describe('6. Webhook State Machine', () => {
    it('allows forward transitions (IN_TRANSIT -> OUT_FOR_DELIVERY)', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'IN_TRANSIT', order: {} });
      await deliveryService.handleWebhookEvent({ awb: 'AWB123', status: 'Out for Delivery' });
      expect(mockPrisma.$transaction).toHaveBeenCalled(); // Means updateDeliveryStatus was called
    });

    it('rejects backward transitions (DELIVERED -> IN_TRANSIT)', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'DELIVERED', order: {} });
      await deliveryService.handleWebhookEvent({ awb: 'AWB123', status: 'In Transit' });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('allows NDR -> OUT_FOR_DELIVERY reattempts', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'NDR', order: {} });
      await deliveryService.handleWebhookEvent({ awb: 'AWB123', status: 'Out for Delivery' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('7. Reconciliation Job', () => {
    it('processes stale shipments', async () => {
      const { createWorker } = await import('../../../shared/utils/queue.manager.js');
      
      mockPrisma.delivery.findMany.mockResolvedValue([
        { id: 'del_1', trackingNumber: 'AWB123', status: 'IN_TRANSIT', orderId: 'ord_1' }
      ]);
      delhiveryShipmentService.trackShipment.mockResolvedValue({ status: 'Delivered' });
      mockPrisma.delivery.findUnique.mockResolvedValue({ id: 'del_1', status: 'IN_TRANSIT', order: {} });
      
      startReconciliationJob();
      const jobFn = createWorker.mock.calls[0][1];
      await jobFn({});

      expect(mockPrisma.delivery.findMany).toHaveBeenCalled();
      expect(delhiveryShipmentService.trackShipment).toHaveBeenCalledWith('AWB123');
      expect(mockPrisma.$transaction).toHaveBeenCalled(); // handleWebhookEvent executed
    });
  });
});
