import axios from 'axios';
import { logger } from '../shared/services/logger.js';
import { AppError } from '../shared/errors/AppError.js';
import { redis } from '../config/redis.js';

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
      throw new AppError('Delhivery API token is not configured in backend.', 500);
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

      // 5. Save to local fallback cache
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
  }
};
