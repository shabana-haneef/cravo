import axios from 'axios';
import { logger } from '../../../shared/services/logger.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { redis } from '../../../config/redis.js';

// Dynamic helpers — read process.env at call time (after dotenv has loaded)
const getToken = () => process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY;
const getTimeout = () => parseInt(process.env.DELHIVERY_TIMEOUT, 10) || 5000;
const getBaseUrl = () =>
  process.env.DELHIVERY_ENV === 'prod'
    ? 'https://track.delhivery.com'
    : 'https://staging-express.delhivery.com';

// Factory — creates a fresh axios client with current env values
const createDelhiveryClient = () => {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: getTimeout(),
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) config.headers['Authorization'] = `Token ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
  return client;
};

// Fallback in-memory cache for pincode serviceability
const memoryCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Cache for 24 hours

export const delhiveryService = {
  /**
   * Phase 1: Connection Test
   * Verifies connectivity to the Delhivery API.
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      if (!getToken()) {
        logger.warn('Delhivery API Token is missing in environment variables.');
        return false;
      }
      const delhiveryClient = createDelhiveryClient();
      // Check connectivity using the standard package check endpoint with a 5s timeout
      await delhiveryClient.get('/api/v1/packages/json/', { timeout: 5000 });
      return true;
    } catch (error) {
      // If server responded, we can verify reachable status.
      // Delhivery responds with 401 Unauthorized if API key is invalid/empty.
      if (error.response) {
        logger.info({ status: error.response.status }, 'Delhivery API server reachable.');
        if (error.response.status === 401 || error.response.status === 403) {
          logger.error('Delhivery connection test failed: Invalid API Token.');
          return false;
        }
        return true;
      }
      logger.error({ message: error.message }, 'Delhivery connection check network/timeout error.');
      return false;
    }
  },

  /**
   * Phase 2: Pincode Serviceability Validation
   * @param {string} pincode
   * @returns {Promise<{deliverable: boolean, pincode: string}>}
   */
  async checkServiceability(pincode) {
    if (!getToken()) {
      logger.warn('Delhivery API token is not configured. Bypassing serviceability check for local testing.');
      return { success: true, deliverable: true, pincode, fallback: true };
    }
    const delhiveryClient = createDelhiveryClient();

    const cacheKey = `cache:delhivery:pincode:${pincode}`;

    // 1. Try fetching from Redis Cache first
    try {
      if (redis && redis.isOpen) {
        const cachedValue = await redis.get(cacheKey);
        if (cachedValue) {
          logger.info({ pincode }, 'Delhivery serviceability cache hit (Redis)');
          return JSON.parse(cachedValue);
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to read from Redis cache, falling back.');
    }

    // 2. Try fetching from in-memory fallback cache
    const localCached = memoryCache.get(pincode);
    if (localCached && (Date.now() - localCached.timestamp < CACHE_TTL_MS)) {
      logger.info({ pincode }, 'Delhivery serviceability cache hit (Memory)');
      return localCached.data;
    }

    // 3. Perform the live API call
    try {
      // Endpoint format: /c/api/pin-codes/json/?filter_codes=pincode
      const response = await delhiveryClient.get('/c/api/pin-codes/json/', {
        params: { filter_codes: pincode }
      });

      const deliveryCodes = response.data?.delivery_codes;
      let deliverable = false;

      if (Array.isArray(deliveryCodes) && deliveryCodes.length > 0) {
        const pinInfo = deliveryCodes[0]?.postal_code;
        // Delhivery API does NOT return an `is_serviceable` field.
        // A pincode is serviceable if it appears in the response AND supports pre_paid or COD.
        deliverable = !!(
          pinInfo &&
          pinInfo.pin === parseInt(pincode, 10) &&
          (pinInfo.pre_paid === 'Y' || pinInfo.cod === 'Y')
        );
      }

      const result = {
        success: true,
        deliverable: !!deliverable,
        pincode
      };

      // 4. Save to Redis Cache
      try {
        if (redis && redis.isOpen) {
          await redis.setEx(cacheKey, 86400, JSON.stringify(result)); // Cache for 24 hours
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Failed to write to Redis cache.');
      }

      memoryCache.set(pincode, {
        timestamp: Date.now(),
        data: result
      });

      return result;
    } catch (error) {
      logger.error({ message: error.message, pincode }, 'Delhivery serviceability check API error.');
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify serviceability with Delhivery API', 500);
    }
  },

  /**
   * Phase 3: Shipping Rate Calculator
   * Calculates live shipping rates from Delhivery API.
   * Falls back to a safe default if API fails.
   * @param {string} originPincode
   * @param {string} destPincode
   * @param {number} weightGrams
   * @param {number} fallbackDefaultCharge
   * @returns {Promise<number>}
   */
  async calculateShippingCharge(originPincode, destPincode, weightGrams, fallbackDefaultCharge = 50) {
    if (!getToken()) {
      logger.warn('Delhivery API token is not configured. Falling back to default delivery charge.');
      return fallbackDefaultCharge;
    }

    const delhiveryClient = createDelhiveryClient();
    try {
      // Delhivery Rate Calculator API: GET /api/kinko/v1/invoice/charges/.json
      const response = await delhiveryClient.get('/api/kinko/v1/invoice/charges/.json', {
        params: {
          md: 'S', // S for Surface, E for Express
          ss: 'Delivered',
          o_pin: originPincode,
          d_pin: destPincode,
          cgm: weightGrams
        }
      });

      if (response.data && response.data.length > 0 && response.data[0].total_amount) {
        return Math.ceil(response.data[0].total_amount);
      }
      
      logger.warn({ data: response.data }, 'Delhivery rate API returned unexpected format. Falling back to default charge.');
      return fallbackDefaultCharge;

    } catch (error) {
      logger.error({ message: error.message, originPincode, destPincode, weightGrams }, 'Delhivery rate calculation failed. Falling back to default charge.');
      return fallbackDefaultCharge;
    }
  }
};

