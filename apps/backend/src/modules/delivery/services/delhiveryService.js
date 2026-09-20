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

// In-flight request deduplication map
const inFlightRequests = new Map();

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
   * Check Pincode Serviceability for normal B2C shipments
   * @param {string} pincode
   * @returns {Promise<Object>}
   */
  async checkPincodeServiceability(pincode) {
    return this.checkServiceability(pincode, { productType: 'B2C' });
  },

  /**
   * Check Pincode Serviceability for Heavy Product Type shipments
   * @param {string} pincode
   * @returns {Promise<Object>}
   */
  async checkHeavyPincodeServiceability(pincode) {
    return this.checkServiceability(pincode, { productType: 'Heavy' });
  },

  /**
   * Phase 2: Pincode Serviceability Validation
   * Supports both Normal B2C and Heavy Product Type serviceability.
   *
   * @param {string} pincode
   * @param {{ productType?: string, product_type?: string }} [options]
   * @returns {Promise<Object>}
   */
  async checkServiceability(pincode, options = {}) {
    // 1. Pincode validation & normalization
    const normalizedPincode = String(pincode || '').trim();
    const pincodeRegex = /^[1-9][0-9]{5}$/;

    if (!pincodeRegex.test(normalizedPincode)) {
      throw new AppError('Please provide a valid 6-digit pincode.', 400, 'INVALID_PINCODE');
    }

    // 2. Product type validation & normalization
    const rawType = options.productType || options.product_type || 'B2C';
    const normalizedType = String(rawType).trim();
    let standardProductType = 'B2C';
    let serviceType = 'B2C';

    if (/^heavy$/i.test(normalizedType)) {
      standardProductType = 'Heavy';
      serviceType = 'HEAVY';
    } else if (/^b2c$/i.test(normalizedType) || /^normal$/i.test(normalizedType)) {
      standardProductType = 'B2C';
      serviceType = 'B2C';
    } else {
      throw new AppError("Invalid product type. Supported types are 'B2C' and 'Heavy'.", 400, 'INVALID_PRODUCT_TYPE');
    }

    // 3. Isolated Cache Keys (strictly prevents B2C and Heavy cache collisions)
    const cacheKey = `delhivery:serviceability:${standardProductType.toLowerCase()}:${normalizedPincode}`;
    const memoryKey = `${standardProductType.toLowerCase()}:${normalizedPincode}`;

    // 4. Check Redis Cache
    try {
      if (redis && redis.isOpen) {
        const cachedValue = await redis.get(cacheKey);
        if (cachedValue) {
          logger.info({ pincode: normalizedPincode, serviceType, productType: standardProductType }, 'Delhivery serviceability cache hit (Redis)');
          const parsed = JSON.parse(cachedValue);
          return { ...parsed, cached: true };
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to read from Redis cache, falling back.');
    }

    // 5. Check in-memory fallback cache
    const localCached = memoryCache.get(memoryKey);
    if (localCached && (Date.now() - localCached.timestamp < CACHE_TTL_MS)) {
      logger.info({ pincode: normalizedPincode, serviceType, productType: standardProductType }, 'Delhivery serviceability cache hit (Memory)');
      return { ...localCached.data, cached: true };
    }

    // 6. In-flight request deduplication to prevent hammering Delhivery with concurrent requests
    if (inFlightRequests.has(memoryKey)) {
      logger.info({ pincode: normalizedPincode, serviceType }, 'Delhivery serviceability request deduplicated (in-flight)');
      return inFlightRequests.get(memoryKey);
    }

    const executeCheck = async () => {
      // 7. Check if API token is configured
      if (!getToken()) {
        logger.warn('Delhivery API token is not configured. Bypassing serviceability check for local testing.');
        return {
          pincode: normalizedPincode,
          serviceable: true,
          deliverable: true,
          serviceType,
          productType: standardProductType,
          prepaid: true,
          cod: true,
          fallback: true,
          cached: false
        };
      }

      const delhiveryClient = createDelhiveryClient();
      const startTime = Date.now();

      // 8. Prepare upstream Delhivery request parameters
      // API A (Normal B2C): GET /c/api/pin-codes/json/?filter_codes={PINCODE}
      // API B (Heavy Product Type): GET /c/api/pin-codes/json/?filter_codes={PINCODE}&pincode={PINCODE}&product_type=Heavy
      const params = {
        filter_codes: normalizedPincode
      };

      if (standardProductType === 'Heavy') {
        params.pincode = normalizedPincode;
        params.product_type = 'Heavy';
      }

      try {
        const response = await delhiveryClient.get('/c/api/pin-codes/json/', { params });
        const durationMs = Date.now() - startTime;

        const deliveryCodes = response.data?.delivery_codes;
        let serviceable = false;
        let pinInfo = null;

        if (Array.isArray(deliveryCodes) && deliveryCodes.length > 0) {
          pinInfo = deliveryCodes[0]?.postal_code;
          // Pincode is serviceable if it matches the query pincode AND supports prepaid or COD
          serviceable = !!(
            pinInfo &&
            Number(pinInfo.pin) === parseInt(normalizedPincode, 10) &&
            (pinInfo.pre_paid === 'Y' || pinInfo.cod === 'Y')
          );
        }

        const resultData = {
          pincode: normalizedPincode,
          serviceable: !!serviceable,
          deliverable: !!serviceable, // Backwards compatibility with previous field name
          serviceType,
          productType: standardProductType,
          cached: false
        };

        if (pinInfo) {
          if (typeof pinInfo.pre_paid === 'string') resultData.prepaid = pinInfo.pre_paid === 'Y';
          if (typeof pinInfo.cod === 'string') resultData.cod = pinInfo.cod === 'Y';
          if (pinInfo.city) resultData.city = pinInfo.city;
          if (pinInfo.state_code) resultData.state = pinInfo.state_code;
          if (pinInfo.district) resultData.district = pinInfo.district;
        }

        // 9. Save to Redis Cache (24 hours TTL)
        try {
          if (redis && redis.isOpen) {
            await redis.setEx(cacheKey, 86400, JSON.stringify(resultData));
          }
        } catch (err) {
          logger.warn({ err: err.message }, 'Failed to write to Redis cache.');
        }

        // 10. Save to in-memory fallback cache
        memoryCache.set(memoryKey, {
          timestamp: Date.now(),
          data: resultData
        });

        logger.info({
          pincode: normalizedPincode,
          serviceType,
          serviceable: resultData.serviceable,
          durationMs
        }, 'Delhivery serviceability check completed successfully');

        return resultData;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        logger.error({
          err: error.message,
          pincode: normalizedPincode,
          serviceType,
          durationMs,
          status: error.response?.status
        }, 'Delhivery serviceability check API communication failure.');

        // Upstream API failure (timeout, 500, 502, 503, network failure) must NEVER be confused with non-serviceability
        throw new AppError(
          'Delivery availability could not be verified right now.',
          503,
          'DELHIVERY_SERVICE_UNAVAILABLE'
        );
      }
    };

    const deduplicatedPromise = executeCheck().finally(() => {
      inFlightRequests.delete(memoryKey);
    });

    inFlightRequests.set(memoryKey, deduplicatedPromise);
    return deduplicatedPromise;
  },

  /**
   * Helper to clear memory cache (primarily used for testing and resets)
   */
  clearCache() {
    memoryCache.clear();
    inFlightRequests.clear();
  },

  /**
   * Phase 3: Shipping Rate Calculator
   * Calculates estimated shipping costs from Delhivery API.
   * Strictly read-only; does not mutate any shipment state.
   *
   * @param {Object} params
   * @param {string} params.originPincode
   * @param {string} params.destinationPincode
   * @param {number} params.weightGrams
   * @param {string} params.mode - 'E' or 'S'
   * @param {string} params.paymentType - Must be 'Pre-paid'
   * @param {string} params.shipmentStatus - 'Delivered', 'RTO', 'DTO'
   * @returns {Promise<Object>}
   */
  async calculateShippingCost(params) {
    const {
      originPincode,
      destinationPincode,
      weightGrams,
      mode = 'S',
      paymentType = 'Pre-paid',
      shipmentStatus = 'Delivered'
    } = params;

    // 1. Validation
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(originPincode) || !pincodeRegex.test(destinationPincode)) {
      throw new AppError('Origin and destination must be valid 6-digit pincodes.', 400, 'INVALID_PINCODE');
    }

    if (paymentType !== 'Pre-paid') {
      throw new AppError('Only Pre-paid payment type is supported for shipping cost calculation.', 400, 'UNSUPPORTED_PAYMENT_TYPE');
    }

    if (!['E', 'S'].includes(mode)) {
      throw new AppError('Mode must be E (Express) or S (Surface).', 400, 'INVALID_MODE');
    }

    if (!['Delivered', 'RTO', 'DTO'].includes(shipmentStatus)) {
      throw new AppError('Shipment status must be Delivered, RTO, or DTO.', 400, 'INVALID_SHIPMENT_STATUS');
    }

    if (typeof weightGrams !== 'number' || weightGrams <= 0 || !Number.isInteger(weightGrams)) {
      throw new AppError('Weight must be a positive integer in grams.', 400, 'INVALID_WEIGHT');
    }

    // 2. Redis Rate Limiting (50 requests / 5 minutes)
    const RATE_LIMIT_KEY = 'delhivery:shipping-cost:rate_limit';
    const RATE_LIMIT_WINDOW_SECONDS = 300;
    const MAX_REQUESTS = 50;

    if (redis && redis.isOpen) {
      try {
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;
        await redis.zRemRangeByScore(RATE_LIMIT_KEY, 0, windowStart);
        const currentCount = await redis.zCard(RATE_LIMIT_KEY);
        if (currentCount >= MAX_REQUESTS) {
          throw new AppError('Delhivery rate calculation rate limit exceeded.', 429, 'DELHIVERY_RATE_LIMITED');
        }
        await redis.zAdd(RATE_LIMIT_KEY, { score: now, value: `${now}:${Math.random().toString(36).slice(2, 6)}` });
        await redis.expire(RATE_LIMIT_KEY, RATE_LIMIT_WINDOW_SECONDS);
      } catch (err) {
        if (err instanceof AppError) throw err;
        logger.warn({ err: err.message }, 'Redis rate limit check failed for shipping cost');
      }
    }

    // 3. Environment Check
    const token = getToken();
    if (!token) {
      throw new AppError('Delhivery API token is not configured.', 500, 'DELHIVERY_UNCONFIGURED');
    }

    // 4. API Call
    const delhiveryClient = createDelhiveryClient();
    let response;
    try {
      response = await delhiveryClient.get('/api/kinko/v1/invoice/charges/.json', {
        params: {
          md: mode,
          ss: shipmentStatus,
          o_pin: originPincode,
          d_pin: destinationPincode,
          cgm: weightGrams,
          pt: paymentType
        }
      });
    } catch (error) {
      const isRateLimited = error.response?.status === 429;
      const isTimeout = error.code === 'ECONNABORTED' || !error.response;
      
      const errorCode = isTimeout ? 'DELHIVERY_TIMEOUT' : (isRateLimited ? 'DELHIVERY_RATE_LIMITED' : 'DELHIVERY_API_ERROR');
      const statusCode = error.response?.status || (isTimeout ? 504 : 502);
      throw new AppError(`Delhivery rate calculation failed: ${error.message}`, statusCode, errorCode);
    }

    // 5. Response Normalization
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const chargeData = response.data[0];
      if (chargeData.total_amount !== undefined && chargeData.total_amount !== null) {
        return {
          estimatedShippingCost: chargeData.total_amount, // Preserve upstream float, no rounding
          currency: 'INR',
          mode,
          weightGrams,
          originPincode,
          destinationPincode,
          paymentType,
          isStaging: process.env.DELHIVERY_ENV !== 'prod'
        };
      }
    }

    throw new AppError('Invalid response format from Delhivery rate API.', 502, 'DELHIVERY_INVALID_RESPONSE');
  },

  /**
   * Thin alias for backwards compatibility
   */
  async calculateShippingCharge(originPincode, destPincode, weightGrams, fallbackDefaultCharge = 50) {
    try {
      const result = await this.calculateShippingCost({
        originPincode,
        destinationPincode: destPincode,
        weightGrams: Math.ceil(weightGrams) // Ensure integer
      });
      return result.estimatedShippingCost;
    } catch (err) {
      logger.warn({ err: err.message, originPincode, destPincode }, 'Delhivery shipping cost fallback triggered');
      return fallbackDefaultCharge;
    }
  }
};

