import { jest } from '@jest/globals';
import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';

// Setup environment
process.env.DELHIVERY_API_TOKEN = 'test_delhivery_token_123';
process.env.DELHIVERY_ENV = 'prod';

// Mock Redis
const mockRedis = {
  isOpen: true,
  get: jest.fn(),
  setEx: jest.fn()
};

await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: mockRedis
}));

// Mock logger
await jest.unstable_mockModule('../../../shared/services/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Import after mocking
const { delhiveryService } = await import('../services/delhiveryService.js');
const { delhiveryController } = await import('../controllers/delhiveryController.js');

describe('Delhivery Pincode Serviceability (Normal B2C & Heavy)', () => {
  let axiosGetSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    delhiveryService.clearCache();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setEx.mockResolvedValue('OK');
    axiosGetSpy = jest.spyOn(axios.Axios.prototype, 'get');
  });

  afterEach(() => {
    axiosGetSpy?.mockRestore();
  });

  describe('1. Normal B2C Serviceability', () => {
    it('successfully checks serviceable B2C pincode', async () => {
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: {
          delivery_codes: [
            {
              postal_code: {
                pin: 680001,
                pre_paid: 'Y',
                cod: 'Y',
                city: 'Thrissur',
                state_code: 'KL',
                district: 'Thrissur'
              }
            }
          ]
        }
      });

      const result = await delhiveryService.checkPincodeServiceability('680001');

      expect(result.serviceable).toBe(true);
      expect(result.deliverable).toBe(true);
      expect(result.serviceType).toBe('B2C');
      expect(result.productType).toBe('B2C');
      expect(result.pincode).toBe('680001');
      expect(result.prepaid).toBe(true);
      expect(result.cod).toBe(true);
      expect(result.city).toBe('Thrissur');
      expect(result.state).toBe('KL');
      expect(result.district).toBe('Thrissur');

      // Verify correct parameters sent to Delhivery API A
      expect(axiosGetSpy).toHaveBeenCalledWith(
        '/c/api/pin-codes/json/',
        expect.objectContaining({
          params: { filter_codes: '680001' }
        })
      );
    });

    it('identifies non-serviceable B2C pincode (empty delivery_codes)', async () => {
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: { delivery_codes: [] }
      });

      const result = await delhiveryService.checkPincodeServiceability('999999');

      expect(result.serviceable).toBe(false);
      expect(result.deliverable).toBe(false);
      expect(result.pincode).toBe('999999');
      expect(result.serviceType).toBe('B2C');
    });

    it('rejects invalid pincode with 400 AppError', async () => {
      await expect(delhiveryService.checkPincodeServiceability('12345')).rejects.toThrow(
        'Please provide a valid 6-digit pincode.'
      );
      await expect(delhiveryService.checkPincodeServiceability('012345')).rejects.toThrow(
        'Please provide a valid 6-digit pincode.'
      );
      await expect(delhiveryService.checkPincodeServiceability('abcdef')).rejects.toThrow(
        'Please provide a valid 6-digit pincode.'
      );
      expect(axiosGetSpy).not.toHaveBeenCalled();
    });

    it('handles Delhivery timeout as 503 DELHIVERY_SERVICE_UNAVAILABLE (does NOT mark unserviceable)', async () => {
      axiosGetSpy.mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));

      await expect(delhiveryService.checkPincodeServiceability('680001')).rejects.toThrow(
        expect.objectContaining({
          statusCode: 503,
          code: 'DELHIVERY_SERVICE_UNAVAILABLE',
          message: 'Delivery availability could not be verified right now.'
        })
      );
    });

    it('handles Delhivery 5xx server failure as 503 DELHIVERY_SERVICE_UNAVAILABLE', async () => {
      const error = new Error('Request failed with status code 502');
      error.response = { status: 502, data: 'Bad Gateway' };
      axiosGetSpy.mockRejectedValueOnce(error);

      await expect(delhiveryService.checkPincodeServiceability('680001')).rejects.toThrow(
        expect.objectContaining({
          statusCode: 503,
          code: 'DELHIVERY_SERVICE_UNAVAILABLE'
        })
      );
    });

    it('handles Redis failure gracefully by querying API and caching in memory', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis connection lost'));
      mockRedis.setEx.mockRejectedValueOnce(new Error('Redis connection lost'));

      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: {
          delivery_codes: [
            {
              postal_code: {
                pin: 680002,
                pre_paid: 'Y',
                cod: 'N',
                city: 'Thrissur',
                state_code: 'KL'
              }
            }
          ]
        }
      });

      const result = await delhiveryService.checkPincodeServiceability('680002');
      expect(result.serviceable).toBe(true);
      expect(result.cod).toBe(false);
      expect(result.prepaid).toBe(true);
    });

    it('serves from Redis cache on cache hit without calling Delhivery', async () => {
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          pincode: '680001',
          serviceable: true,
          deliverable: true,
          serviceType: 'B2C',
          productType: 'B2C',
          city: 'Thrissur'
        })
      );

      const result = await delhiveryService.checkPincodeServiceability('680001');

      expect(result.cached).toBe(true);
      expect(result.serviceable).toBe(true);
      expect(result.city).toBe('Thrissur');
      expect(axiosGetSpy).not.toHaveBeenCalled();
    });
  });

  describe('2. Heavy Product Type Serviceability', () => {
    it('successfully checks serviceable Heavy shipment with exact parameters', async () => {
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: {
          delivery_codes: [
            {
              postal_code: {
                pin: 680001,
                pre_paid: 'Y',
                cod: 'Y',
                city: 'Thrissur',
                state_code: 'KL',
                district: 'Thrissur'
              }
            }
          ]
        }
      });

      const result = await delhiveryService.checkHeavyPincodeServiceability('680001');

      expect(result.serviceable).toBe(true);
      expect(result.serviceType).toBe('HEAVY');
      expect(result.productType).toBe('Heavy');
      expect(result.pincode).toBe('680001');

      // Verify correct parameters sent to Delhivery API B (Heavy)
      expect(axiosGetSpy).toHaveBeenCalledWith(
        '/c/api/pin-codes/json/',
        expect.objectContaining({
          params: {
            filter_codes: '680001',
            pincode: '680001',
            product_type: 'Heavy'
          }
        })
      );
    });

    it('identifies non-serviceable Heavy pincode', async () => {
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: { delivery_codes: [] }
      });

      const result = await delhiveryService.checkHeavyPincodeServiceability('190001');

      expect(result.serviceable).toBe(false);
      expect(result.serviceType).toBe('HEAVY');
      expect(result.productType).toBe('Heavy');
    });

    it('rejects invalid product type with 400 INVALID_PRODUCT_TYPE', async () => {
      await expect(
        delhiveryService.checkServiceability('680001', { productType: 'FragileExpress' })
      ).rejects.toThrow("Invalid product type. Supported types are 'B2C' and 'Heavy'.");
      expect(axiosGetSpy).not.toHaveBeenCalled();
    });

    it('handles Heavy API timeout with 503 status code', async () => {
      axiosGetSpy.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(delhiveryService.checkHeavyPincodeServiceability('680001')).rejects.toThrow(
        expect.objectContaining({
          statusCode: 503,
          code: 'DELHIVERY_SERVICE_UNAVAILABLE'
        })
      );
    });
  });

  describe('3. Cache Isolation Between B2C and Heavy', () => {
    it('ensures B2C cache does NOT satisfy Heavy check and vice versa', async () => {
      // 1. Mock Redis returning cache hit ONLY for B2C
      mockRedis.get.mockImplementation(async (key) => {
        if (key === 'delhivery:serviceability:b2c:560001') {
          return JSON.stringify({
            pincode: '560001',
            serviceable: true,
            serviceType: 'B2C',
            productType: 'B2C'
          });
        }
        return null;
      });

      // 2. Query B2C -> should hit cache
      const b2cResult = await delhiveryService.checkPincodeServiceability('560001');
      expect(b2cResult.cached).toBe(true);
      expect(b2cResult.serviceType).toBe('B2C');
      expect(axiosGetSpy).not.toHaveBeenCalled();

      // 3. Query Heavy for same pincode -> must NOT use B2C cache and must call Delhivery
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: {
          delivery_codes: [
            {
              postal_code: {
                pin: 560001,
                pre_paid: 'Y',
                cod: 'Y'
              }
            }
          ]
        }
      });

      const heavyResult = await delhiveryService.checkHeavyPincodeServiceability('560001');
      expect(heavyResult.cached).toBe(false);
      expect(heavyResult.serviceType).toBe('HEAVY');
      expect(axiosGetSpy).toHaveBeenCalledWith(
        '/c/api/pin-codes/json/',
        expect.objectContaining({
          params: expect.objectContaining({ product_type: 'Heavy' })
        })
      );
    });
  });

  describe('4. In-Flight Request Deduplication', () => {
    it('deduplicates simultaneous in-flight requests for the same pincode and serviceType', async () => {
      let resolveApi;
      const apiPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });

      axiosGetSpy.mockImplementationOnce(() => apiPromise);

      // Fire 3 simultaneous requests for 682001
      const req1 = delhiveryService.checkPincodeServiceability('682001');
      const req2 = delhiveryService.checkPincodeServiceability('682001');
      const req3 = delhiveryService.checkPincodeServiceability('682001');

      // Resolve the single upstream call
      resolveApi({
        status: 200,
        data: {
          delivery_codes: [
            {
              postal_code: {
                pin: 682001,
                pre_paid: 'Y',
                cod: 'Y',
                city: 'Kochi'
              }
            }
          ]
        }
      });

      const [res1, res2, res3] = await Promise.all([req1, req2, req3]);

      expect(res1.serviceable).toBe(true);
      expect(res2.serviceable).toBe(true);
      expect(res3.serviceable).toBe(true);
      // Ensure only 1 HTTP request was made
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Controller HTTP Responses Contract', () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = { params: {}, query: {}, path: '' };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
    });

    it('returns 400 for invalid pincode format', async () => {
      mockReq.params.pincode = 'invalid_pin';

      await delhiveryController.checkServiceability(mockReq, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PINCODE',
          message: 'Please provide a valid 6-digit pincode.'
        }
      });
    });

    it('returns 400 for invalid productType parameter', async () => {
      mockReq.params.pincode = '680001';
      mockReq.query.productType = 'SuperHeavyCargo';

      await delhiveryController.checkServiceability(mockReq, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PRODUCT_TYPE',
          message: "Invalid product type. Supported types are 'B2C' and 'Heavy'."
        }
      });
    });

    it('returns 200 with normalized response for valid request', async () => {
      mockReq.params.pincode = '680001';
      mockReq.query.productType = 'Heavy';

      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: {
          delivery_codes: [
            {
              postal_code: {
                pin: 680001,
                pre_paid: 'Y',
                cod: 'Y',
                city: 'Thrissur',
                state_code: 'KL'
              }
            }
          ]
        }
      });

      await delhiveryController.checkServiceability(mockReq, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          deliverable: true,
          pincode: '680001',
          data: expect.objectContaining({
            serviceable: true,
            serviceType: 'HEAVY',
            productType: 'Heavy',
            city: 'Thrissur'
          })
        })
      );
    });

    it('returns 503 DELHIVERY_SERVICE_UNAVAILABLE on upstream failure', async () => {
      mockReq.params.pincode = '680001';

      axiosGetSpy.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      await delhiveryController.checkServiceability(mockReq, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DELHIVERY_SERVICE_UNAVAILABLE',
          message: 'Delivery availability could not be verified right now.'
        }
      });
    });
  });
});
