import { jest } from '@jest/globals';
import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';

process.env.DELHIVERY_API_TOKEN = 'test_token';
process.env.DELHIVERY_ENV = 'prod';

const mockRedis = {
  isOpen: true,
  get: jest.fn(),
  setEx: jest.fn(),
  zRemRangeByScore: jest.fn(),
  zCard: jest.fn(),
  zAdd: jest.fn(),
  expire: jest.fn()
};

await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: mockRedis
}));

await jest.unstable_mockModule('../../../shared/services/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { delhiveryService } = await import('../services/delhiveryService.js');
const { delhiveryController } = await import('../controllers/delhiveryController.js');

describe('Delhivery Calculate Shipping Cost API', () => {
  let axiosGetSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    axiosGetSpy = jest.spyOn(axios.Axios.prototype, 'get');
    mockRedis.zCard.mockResolvedValue(0); // Not rate limited by default
  });

  afterEach(() => {
    axiosGetSpy?.mockRestore();
  });

  describe('A. Input Validation', () => {
    it('rejects missing or invalid pincodes', async () => {
      await expect(delhiveryService.calculateShippingCost({ originPincode: '123', destinationPincode: '110053', weightGrams: 500 }))
        .rejects.toThrow(/valid 6-digit pincode/i);
    });

    it('rejects COD payment type', async () => {
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500, paymentType: 'COD' }))
        .rejects.toThrow(/Pre-paid/i);
    });

    it('rejects invalid weight', async () => {
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 0 }))
        .rejects.toThrow(/positive integer/i);
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: -500 }))
        .rejects.toThrow(/positive integer/i);
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500.5 }))
        .rejects.toThrow(/positive integer/i);
    });

    it('rejects invalid mode', async () => {
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500, mode: 'X' }))
        .rejects.toThrow(/Mode must be E/i);
    });

    it('rejects invalid shipment status', async () => {
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500, shipmentStatus: 'PENDING' }))
        .rejects.toThrow(/Shipment status/i);
    });
  });

  describe('B. Correct Delhivery Request', () => {
    it('calls Delhivery API with correct parameters', async () => {
      axiosGetSpy.mockResolvedValueOnce({ data: [{ total_amount: 150.5 }] });
      const res = await delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500 });
      expect(res.estimatedShippingCost).toBe(150.5);
      expect(axiosGetSpy).toHaveBeenCalledWith('/api/kinko/v1/invoice/charges/.json', expect.objectContaining({
        params: { md: 'S', ss: 'Delivered', o_pin: '110042', d_pin: '110053', cgm: 500, pt: 'Pre-paid' }
      }));
    });
  });

  describe('C. Upstream Responses & Fallback Behavior', () => {
    it('returns exact upstream float without rounding', async () => {
      axiosGetSpy.mockResolvedValueOnce({ data: [{ total_amount: 45.99 }] });
      const res = await delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500 });
      expect(res.estimatedShippingCost).toBe(45.99);
    });

    it('throws error on upstream timeout', async () => {
      axiosGetSpy.mockRejectedValueOnce({ code: 'ECONNABORTED' });
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500 }))
        .rejects.toThrow(/timeout|failed/i);
    });

    it('calculateShippingCharge alias catches error and returns fallback', async () => {
      axiosGetSpy.mockRejectedValueOnce({ response: { status: 500 } });
      const charge = await delhiveryService.calculateShippingCharge('110042', '110053', 500, 60);
      expect(charge).toBe(60); // Uses fallback
    });
  });

  describe('D. Rate Limiting', () => {
    it('throws 429 when max requests exceeded', async () => {
      mockRedis.zCard.mockResolvedValueOnce(50); // 50 requests in window
      await expect(delhiveryService.calculateShippingCost({ originPincode: '110042', destinationPincode: '110053', weightGrams: 500 }))
        .rejects.toThrow(/rate limit exceeded/i);
      expect(axiosGetSpy).not.toHaveBeenCalled();
    });
  });

  describe('E. Controller Logic', () => {
    it('returns success response for valid GET request', async () => {
      axiosGetSpy.mockResolvedValueOnce({ data: [{ total_amount: 100 }] });
      const req = { query: { originPincode: '110042', destinationPincode: '110053', weightGrams: '500', mode: 'E' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await delhiveryController.calculateShippingCost(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.objectContaining({ estimatedShippingCost: 100 }) }));
    });
  });
});
