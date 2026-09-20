import { jest } from '@jest/globals';
import { AppError } from '../../../shared/errors/AppError.js';
import axios from 'axios';

// Setup Mocks
await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: {
    delivery: {
      findFirst: jest.fn(),
      update: jest.fn()
    },
    seller: {
      findUnique: jest.fn()
    }
  }
}));

await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: {
    isOpen: true,
    set: jest.fn(),
    del: jest.fn(),
    zRemRangeByScore: jest.fn(),
    zCard: jest.fn(),
    zAdd: jest.fn(),
    expire: jest.fn()
  },
  pubClient: {},
  subClient: {}
}));

const mockAxiosInstance = {
  get: jest.fn(),
  interceptors: { request: { use: jest.fn() } }
};

jest.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance);
process.env.DELHIVERY_API_TOKEN = 'mock-token';

const { default: prisma } = await import('../../../lib/prisma.js');
const { redis } = await import('../../../config/redis.js');

const { deliveryService } = await import('../services/delivery.service.js');
const { delhiveryShipmentService } = await import('../services/delhiveryShipmentService.js');

describe('Delhivery Generate Shipping Label API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.set.mockResolvedValue('OK');
    redis.del.mockResolvedValue(1);
    redis.zCard.mockResolvedValue(0);
  });

  describe('A. Validation & State Boundaries', () => {
    it('rejects if Delivery record not found', async () => {
      prisma.delivery.findFirst.mockResolvedValue(null);
      await expect(deliveryService.getShippingLabel('invalid_id', { role: 'ADMIN' }, null))
        .rejects.toThrow(/Delivery record not found/);
    });

    it('rejects if Delivery has no trackingNumber (unmanifested)', async () => {
      prisma.delivery.findFirst.mockResolvedValue({ trackingNumber: null });
      await expect(deliveryService.getShippingLabel('del_1', { role: 'ADMIN' }, null))
        .rejects.toThrow(/Shipment is not manifested yet/);
    });

    it('rejects if Delivery is CANCELLED', async () => {
      prisma.delivery.findFirst.mockResolvedValue({ trackingNumber: 'AWB1', status: 'CANCELLED' });
      await expect(deliveryService.getShippingLabel('del_1', { role: 'ADMIN' }, null))
        .rejects.toThrow(/Cannot generate label for a shipment in CANCELLED state/);
    });

    it('rejects invalid pdfSize', async () => {
      await expect(delhiveryShipmentService.generateShippingLabel('AWB1', 'A5'))
        .rejects.toThrow(/Invalid label size requested/);
    });
  });

  describe('B. Authorization', () => {
    it('rejects seller accessing another seller\'s Delivery', async () => {
      prisma.delivery.findFirst.mockResolvedValue({ 
        trackingNumber: 'AWB1', 
        status: 'BOOKED',
        order: { shop: { sellerId: 'seller_other' } }
      });
      prisma.seller.findUnique.mockResolvedValue({ id: 'seller_1' });
      
      await expect(deliveryService.getShippingLabel('del_1', { role: 'SELLER', id: 'user_1' }, null))
        .rejects.toThrow(/Unauthorized access/);
    });
  });

  describe('C. Caching and Idempotency', () => {
    it('returns existing shippingLabelUrl immediately if no pdfSize specified', async () => {
      prisma.delivery.findFirst.mockResolvedValue({ 
        trackingNumber: 'AWB1', 
        status: 'BOOKED',
        shippingLabelUrl: 'http://existing.pdf'
      });

      const result = await deliveryService.getShippingLabel('del_1', { role: 'ADMIN' }, undefined);
      expect(result.shippingLabelUrl).toBe('http://existing.pdf');
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('generates new URL from Delhivery if specific pdfSize (4R) requested despite existing URL', async () => {
      prisma.delivery.findFirst.mockResolvedValue({ 
        id: 'del_1',
        trackingNumber: 'AWB1', 
        status: 'BOOKED',
        shippingLabelUrl: 'http://existing.pdf'
      });

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          packages: [{ wbn: 'AWB1', pdf_download_link: 'http://new_4r.pdf' }]
        }
      });

      const result = await deliveryService.getShippingLabel('del_1', { role: 'ADMIN' }, '4R');
      expect(result.shippingLabelUrl).toBe('http://new_4r.pdf');
      expect(result.size).toBe('4R');
      
      // Should NOT overwrite canonical DB url
      expect(prisma.delivery.update).not.toHaveBeenCalled();
    });

    it('generates new URL and saves to DB if no existing URL and no specific pdfSize', async () => {
      prisma.delivery.findFirst.mockResolvedValue({ 
        id: 'del_1',
        trackingNumber: 'AWB1', 
        status: 'BOOKED',
        shippingLabelUrl: null
      });

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          packages: [{ wbn: 'AWB1', pdf_download_link: 'http://new_a4.pdf' }]
        }
      });

      const result = await deliveryService.getShippingLabel('del_1', { role: 'ADMIN' }, undefined);
      expect(result.shippingLabelUrl).toBe('http://new_a4.pdf');
      expect(result.size).toBe('A4');
      
      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'del_1' },
        data: { shippingLabelUrl: 'http://new_a4.pdf' }
      });
    });
  });

  describe('D. Concurrent Protection and Rate Limiting', () => {
    it('throws error if lock cannot be acquired (concurrent request)', async () => {
      prisma.delivery.findFirst.mockResolvedValue({ 
        id: 'del_1', trackingNumber: 'AWB1', status: 'BOOKED', shippingLabelUrl: null 
      });
      redis.set.mockResolvedValue(null); // lock failed

      await expect(deliveryService.getShippingLabel('del_1', { role: 'ADMIN' }, null))
        .rejects.toThrow(/Shipping label generation is already in progress/);
    });

    it('enforces 3000/5m rate limit in service', async () => {
      redis.zCard.mockResolvedValue(3000); // Max requests reached

      await expect(delhiveryShipmentService.generateShippingLabel('AWB1', 'A4'))
        .rejects.toThrow(/Delhivery label generation rate limit exceeded/);
    });
  });
});
