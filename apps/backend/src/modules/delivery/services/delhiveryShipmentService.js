import { logger } from '../../../shared/services/logger.js';
import { checkSlidingRateLimit } from '../../../shared/utils/rateLimiter.js';
import { AppError } from '../../../shared/errors/AppError.js';
import axios from 'axios';
import { redis } from '../../../config/redis.js';

// Dynamic helpers — read process.env at call time (after dotenv has loaded)
const getToken = () => process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY;
const getTimeout = () => parseInt(process.env.DELHIVERY_TIMEOUT, 10) || 5000;
const getBaseUrl = () =>
  process.env.DELHIVERY_ENV === 'prod'
    ? 'https://track.delhivery.com'
    : 'https://staging-express.delhivery.com';

const createDelhiveryClient = () => {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: getTimeout(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

// Helper function for exponential backoff retries
async function fetchWithRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    logger.warn(`Delhivery API call failed. Retrying in ${delay}ms... Error: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
}

export const delhiveryShipmentService = {
  /**
   * Register Seller Pickup Location / Warehouse with Delhivery Client Warehouse API
   */
  async registerPickupLocation(seller) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot register warehouse.', 500);
    }
    if (!seller || !seller.pickupLocationName) {
      throw new AppError('Seller missing pickupLocationName.', 400);
    }

    const delhiveryClient = createDelhiveryClient();
    // Delhivery Client Warehouse creation payload
    const warehousePayload = {
      name: seller.pickupLocationName,
      email: seller.supportEmail || seller.user?.email || 'seller@cravomarketplace.com',
      phone: seller.pickupPhone || seller.supportPhone || '9876543210',
      address: seller.pickupAddress || '',
      city: seller.pickupCity || '',
      state: seller.pickupState || '',
      country: 'India',
      pin: seller.pickupPincode || '',
      return_address: seller.pickupAddress || '',
      return_city: seller.pickupCity || '',
      return_state: seller.pickupState || '',
      return_country: 'India',
      return_pin: seller.pickupPincode || ''
    };

    try {
      const response = await delhiveryClient.post('/api/backend/clientwarehouse/create/', warehousePayload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && (response.data.success || response.data.status)) {
        logger.info({ pickupLocationName: seller.pickupLocationName }, 'Successfully registered/synced pickup location with Delhivery.');
        // The API returns the registered warehouse name/identifier
        const locationId = response.data.data?.name || seller.pickupLocationName;
        return { success: true, locationId };
      }
      
      throw new AppError(`Delhivery Warehouse Creation failed: ${JSON.stringify(response.data)}`, 400);
    } catch (error) {
      logger.error({ err: error.message, locationName: seller.pickupLocationName }, 'Delhivery Warehouse Creation error');
      throw new AppError(`Failed to register Delhivery pickup location: ${error.response?.data?.error || error.message}`, error.response?.status || 500);
    }
  },

  async editClientWarehouse(seller, updateData, clientIp) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot edit warehouse.', 500);
    }
    if (!seller || !seller.pickupLocationName) {
      throw new AppError('Seller missing pickupLocationName.', 400);
    }
    if (!updateData.pincode) {
      throw new AppError('pincode is required for warehouse edit.', 400);
    }

    await checkSlidingRateLimit(
      `delhivery:client-warehouse-edit:rate_limit:${clientIp || 'unknown'}`,
      10,
      60,
      'Delhivery warehouse edit rate limit exceeded. Please try again in a minute.',
      'DELHIVERY_WAREHOUSE_RATE_LIMITED'
    );

    const delhiveryClient = createDelhiveryClient();
    const payload = {
      name: seller.pickupLocationName,
      pin: updateData.pincode
    };
    if (updateData.address !== undefined) {
      payload.address = updateData.address;
    }
    if (updateData.phone !== undefined) {
      payload.phone = updateData.phone;
    }

    try {
      const response = await delhiveryClient.post('/api/backend/clientwarehouse/edit/', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 seconds timeout for warehouse edit
      });

      if (response.data && (response.data.success || response.data.status)) {
        logger.info({ pickupLocationName: seller.pickupLocationName }, 'Successfully edited pickup location with Delhivery.');
        return { success: true, data: response.data };
      }
      
      throw new AppError(`Delhivery Warehouse Edit failed: ${JSON.stringify(response.data)}`, 400);
    } catch (error) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      logger.error({ err: error.message, locationName: seller.pickupLocationName, isTimeout }, 'Delhivery Warehouse Edit error');
      
      if (isTimeout) {
        throw new AppError('Delhivery Warehouse Edit timed out', 504, 'AMBIGUOUS_TIMEOUT');
      }
      
      throw new AppError(`Failed to edit Delhivery pickup location: ${error.response?.data?.error || error.message}`, error.response?.status || 500);
    }
  },

  async createShipment(order, seller, deliveryAddress, options = {}) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot create shipment in production.', 500);
    }

    if (seller.delhiveryRegistrationStatus !== 'REGISTERED' || !seller.delhiveryPickupLocationId) {
      throw new AppError('Shipment blocked: Seller pickup location is not registered with Delhivery.', 400);
    }

    const delhiveryClient = createDelhiveryClient();

    // Idempotency: Check if the shipment is already created for this exact orderNumber
    const existingShipment = await delhiveryShipmentService.findShipmentByOrderNumber(order.orderNumber);
    if (existingShipment && existingShipment.success) {
      logger.info({ orderNumber: order.orderNumber, trackingNumber: existingShipment.trackingNumber }, 'Recovered existing Delhivery shipment to prevent duplicate.');
      return existingShipment;
    }

    // Calculate total weight in grams from items or fallback
    const totalWeightGrams = (order.items || []).reduce((sum, item) => {
      const itemWeight = item.productVariant?.weight || item.weightGrams || 500;
      return sum + (itemWeight * (item.quantity || 1));
    }, 0) || 500;

    const grandTotal = Math.round(Number(order.grandTotal) || 500);
    const productsDesc = (order.items || [])
      .map(i => i.product?.name || i.productName || 'Item')
      .filter(Boolean)
      .join(', ') || 'General Marketplace Order';

    const shipmentPackage = {
      name: deliveryAddress.fullName,
      add: `${deliveryAddress.addressLine1} ${deliveryAddress.addressLine2 || ''}`.trim(),
      pin: deliveryAddress.postalCode,
      city: deliveryAddress.city,
      state: deliveryAddress.state,
      country: 'India',
      phone: deliveryAddress.phone,
      order: order.orderNumber, // Deterministic unique reference
      payment_mode: order.payments?.length > 0 ? 'Pre-paid' : 'COD',
      weight: totalWeightGrams.toString(),
      declared_value: grandTotal.toString(),
      products_desc: productsDesc,
      pickup_location: seller.pickupLocationName, // String matching registered warehouse
      return_pin: seller.pickupPincode,
      return_city: seller.pickupCity,
      return_phone: seller.pickupPhone,
      return_add: seller.pickupAddress,
      return_state: seller.pickupState,
      return_country: 'India'
    };

    if (options && options.waybill) {
      shipmentPackage.waybill = String(options.waybill).trim();
    }

    const payloadData = {
      shipments: [shipmentPackage],
      pickup_location: {
        name: seller.pickupLocationName,
        add: seller.pickupAddress,
        city: seller.pickupCity,
        pin: seller.pickupPincode,
        country: 'India',
        phone: seller.pickupPhone
      }
    };

    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('data', JSON.stringify(payloadData));

    const apiCall = () => delhiveryClient.post('/api/cmu/create.json', params);

    try {
      const response = await fetchWithRetry(apiCall);
      const data = response.data;

      if (data && data.success) {
        const pkg = data.packages?.[0];
        if (pkg && pkg.status === 'Success') {
          return {
            success: true,
            trackingNumber: pkg.waybill,
            shipmentId: pkg.refnum || pkg.client,
            status: 'BOOKED',
            remarks: pkg.remarks || 'Shipment created successfully'
          };
        } else {
          const reason = pkg?.remarks || data.rmk || 'Unknown Delhivery response failure';
          throw new AppError(`Delhivery Error: ${reason}`, 400);
        }
      } else {
        const errorMsg = data?.rmk || JSON.stringify(data) || 'Unknown error response';
        throw new AppError(`Delhivery: Failed to create shipment. ${errorMsg}`, 400);
      }
    } catch (error) {
      // Securely censor key/token in logs
      const sanitizedMessage = error.message ? error.message.replace(new RegExp(getToken() || '', 'g'), '***') : '';
      logger.error({ err: sanitizedMessage }, 'Delhivery Shipment API Communication Error');
      throw new AppError(error.statusCode ? error.message : 'Failed to communicate with Delhivery API', error.statusCode || 500);
    }
  },

  async createPickupRequest(seller, expectedPackageCount = 1, options = {}) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot schedule pickup in production.', 500);
    }
    if (!seller || !seller.pickupLocationName) {
      throw new AppError('Seller missing pickupLocationName.', 400);
    }

    const packageCount = Number(expectedPackageCount);
    if (!Number.isInteger(packageCount) || packageCount <= 0) {
      throw new AppError('expected_package_count must be a positive integer', 400);
    }

    await checkSlidingRateLimit(
      'delhivery:pickup-request:rate_limit',
      4000,
      300,
      'Delhivery pickup creation rate limit exceeded. Please try again in a few minutes.',
      'DELHIVERY_PICKUP_RATE_LIMITED'
    );

    const delhiveryClient = createDelhiveryClient();

    const targetDate = options?.pickup_date || options?.pickupDate;
    const targetTime = options?.pickup_time || options?.pickupTime;

    // Support optional custom pickup_date (YYYY-MM-DD) and pickup_time (HH:MM:SS)
    const payload = {
      pickup_location: seller.pickupLocationName,
      expected_package_count: packageCount.toString(),
      ...(targetDate ? { pickup_date: String(targetDate).trim() } : {}),
      ...(targetTime ? { pickup_time: String(targetTime).trim() } : {})
    };

    try {
      // Do not use blind retries to prevent duplicate pickup creation on ambiguous timeout
      const response = await delhiveryClient.post('/fm/request/new/', payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data;
      
      // Delhivery returns pr_id or pickup_id on success
      if (data && !data.error && (data.pickup_id || data.pr_id || data.status === 'Success' || data.success === true)) {
        const startTime = data.pickup_start_time || data.pickup_time;
        const endTime = data.pickup_end_time;
        let pDate = data.pickup_date || options.pickup_date || null;
        let pSlot = null;

        if (startTime) {
          if (!pDate && startTime.includes('T')) pDate = startTime.split('T')[0];
          
          const startStr = startTime.includes('T') ? startTime.split('T')[1].substring(0,5) : startTime;
          const endStr = endTime && endTime.includes('T') ? endTime.split('T')[1].substring(0,5) : null;
          pSlot = endStr ? `${startStr} - ${endStr}` : startStr;
        } else if (options.pickup_time) {
          pSlot = options.pickup_time;
        }

        return {
          success: true,
          pickupId: data.pickup_id || data.pr_id || null,
          pickupDate: pDate,
          pickupTime: pSlot, // Maps to pickupSlot in delivery.service
          remarks: data.remarks || 'Pickup scheduled successfully'
        };
      }
      throw new AppError(`Failed to schedule pickup: ${data?.error || data?.rmk || JSON.stringify(data)}`, 400);
    } catch (error) {
      const sanitizedMessage = error.message ? error.message.replace(new RegExp(getToken() || '', 'g'), '***') : '';
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout') || !error.response;
      
      logger.error({ err: sanitizedMessage, locationName: seller.pickupLocationName, isTimeout }, 'Delhivery Pickup Request API Error');

      const statusCode = error.response?.status || (error.statusCode || (isTimeout ? 504 : 500));
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.remark || error.message || 'Failed to schedule Delhivery pickup';
      const appErr = new AppError(`Delhivery Pickup Scheduling error: ${errMsg}`, statusCode, isTimeout ? 'DELHIVERY_PICKUP_SCHEDULE_TIMEOUT' : 'DELHIVERY_PICKUP_SCHEDULE_FAILED');
      appErr.isAmbiguous = isTimeout;
      throw appErr;
    }
  },

  /**
   * Cancel Pickup Request API
   * Endpoint: POST /fm/request/cancel/
   * Payload: { pickup_id: "<PICKUP_ID>", pickup_location: "<LOCATION_NAME>" }
   */
  async cancelPickupRequest({ pickupId, pickupLocation }) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot cancel pickup in production.', 500);
    }
    const cleanPickupId = String(pickupId || '').trim();
    const cleanLocation = String(pickupLocation || '').trim();

    if (!cleanPickupId) {
      throw new AppError('A valid pickup ID is required to cancel a pickup.', 400, 'INVALID_PICKUP_ID');
    }

    const payload = {
      pickup_id: cleanPickupId,
      ...(cleanLocation ? { pickup_location: cleanLocation } : {})
    };

    const delhiveryClient = createDelhiveryClient();
    try {
      // Do not use blind retries on cancellation to prevent duplicate cancellation requests
      const response = await delhiveryClient.post('/fm/request/cancel/', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;
      const isSuccess = data?.status === true || data?.success === true || (typeof data === 'string' && data.toLowerCase().includes('success')) || data?.pickup_id || data?.pr_id;
      if (!isSuccess && data?.status !== undefined) {
        const errorMsg = data?.error || data?.remark || data?.message || JSON.stringify(data);
        throw new AppError(`Delhivery Pickup Cancellation rejected: ${errorMsg}`, 400);
      }

      logger.info({ pickupId: cleanPickupId, pickupLocation: cleanLocation }, 'Successfully cancelled Delhivery pickup request');

      return {
        success: true,
        pickupId: cleanPickupId,
        remark: data?.remark || 'Pickup cancelled successfully'
      };
    } catch (error) {
      const sanitizedMessage = error.message ? error.message.replace(new RegExp(getToken() || '', 'g'), '***') : '';
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout') || !error.response;

      logger.error({ err: sanitizedMessage, pickupId: cleanPickupId, isTimeout }, 'Delhivery Pickup Cancellation API Error');

      const statusCode = error.response?.status || (error.statusCode || (isTimeout ? 504 : 500));
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.remark || error.message || 'Failed to cancel Delhivery pickup request';
      const appErr = new AppError(`Delhivery Pickup Cancellation error: ${errMsg}`, statusCode, isTimeout ? 'DELHIVERY_PICKUP_CANCEL_TIMEOUT' : 'DELHIVERY_PICKUP_CANCEL_FAILED');
      appErr.isAmbiguous = isTimeout;
      throw appErr;
    }
  },

  async generateShippingLabel(trackingNumber, pdfSize = undefined) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot generate label in production.', 500);
    }

    if (pdfSize && !['A4', '4R'].includes(pdfSize)) {
      throw new AppError('Invalid label size requested. Supported sizes are A4 or 4R.', 400, 'INVALID_LABEL_SIZE');
    }

    // Rate Limiting (3000 requests / 5 minutes)
    const RATE_LIMIT_KEY = 'delhivery:shipping-label:rate_limit';
    const RATE_LIMIT_WINDOW_SECONDS = 300;
    const MAX_REQUESTS = 3000;

    if (redis && redis.isOpen) {
      try {
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;
        await redis.zRemRangeByScore(RATE_LIMIT_KEY, 0, windowStart);
        const currentCount = await redis.zCard(RATE_LIMIT_KEY);
        if (currentCount >= MAX_REQUESTS) {
          throw new AppError('Delhivery label generation rate limit exceeded.', 429, 'DELHIVERY_LABEL_RATE_LIMITED');
        }
        await redis.zAdd(RATE_LIMIT_KEY, { score: now, value: `${now}:${Math.random().toString(36).slice(2, 6)}` });
        await redis.expire(RATE_LIMIT_KEY, RATE_LIMIT_WINDOW_SECONDS);
      } catch (err) {
        if (err instanceof AppError) throw err;
        logger.warn({ err: err.message }, 'Redis rate limit check failed for shipping label');
      }
    }

    try {
      const delhiveryClient = createDelhiveryClient();
      const params = { wbns: trackingNumber, pdf: 'true' };
      if (pdfSize) {
        params.pdf_size = pdfSize;
      }

      // Returns JSON with a link to the PDF
      const response = await delhiveryClient.get('/api/p/packing_slip', { params });
      
      const data = response.data;
      if (data && data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
        const pkg = data.packages.find(p => p.wbn === trackingNumber);
        if (pkg && pkg.pdf_download_link && typeof pkg.pdf_download_link === 'string') {
          return pkg.pdf_download_link;
        }
      }
      throw new AppError('Shipping label not found or generated yet', 404, 'LABEL_NOT_AVAILABLE');
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      const isRateLimited = error.response?.status === 429;
      const isTimeout = error.code === 'ECONNABORTED' || !error.response;
      
      const errorCode = isTimeout ? 'DELHIVERY_LABEL_TIMEOUT' : (isRateLimited ? 'DELHIVERY_LABEL_RATE_LIMITED' : 'DELHIVERY_LABEL_UPSTREAM_ERROR');
      const statusCode = error.response?.status || (isTimeout ? 504 : 502);

      logger.error({ err: error.message, trackingNumber, errorCode, statusCode }, 'Delhivery Label Generation Error');
      throw new AppError(`Failed to generate shipping label: ${error.message}`, statusCode, errorCode);
    }
  },

  async findShipmentByOrderNumber(orderNumber) {
    if (!getToken()) return null;
    
    try {
      const delhiveryClient = createDelhiveryClient();
      const response = await delhiveryClient.get('/api/v1/packages/json/', {
        params: { ref_ids: orderNumber }
      });
      
      const data = response.data;
      if (data && data.ShipmentData && data.ShipmentData.length > 0) {
        const shipment = data.ShipmentData[0].Shipment;
        if (shipment) {
          return {
            success: true,
            trackingNumber: shipment.AWB,
            status: shipment.Status?.Status || 'CREATED'
          };
        }
      }
      return null; // Not found
    } catch (error) {
      logger.warn({ err: error.message, orderNumber }, 'Delhivery shipment search failed');
      return null;
    }
  },



  async trackShipment(trackingNumberOrArray) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot track shipment in production.', 500);
    }

    const waybills = Array.isArray(trackingNumberOrArray) ? trackingNumberOrArray : [trackingNumberOrArray];
    const uniqueWaybills = [...new Set(waybills.map(w => String(w).trim()).filter(Boolean))];
    
    if (uniqueWaybills.length === 0) return null;
    if (uniqueWaybills.length > 50) {
      throw new AppError('Delhivery tracking API supports a maximum of 50 waybills per request.', 400);
    }

    // Shared Rate Limiter for Tracking API (750 requests / 5 mins)
    // Basic Redis token bucket or sliding window limit could be used. 
    // Here we implement a simple incrementing counter.
    const RATE_LIMIT_KEY = 'delhivery:tracking:rate_limit';
    try {
      if (redis && redis.isOpen) {
        const current = await redis.incr(RATE_LIMIT_KEY);
        if (current === 1) {
          await redis.expire(RATE_LIMIT_KEY, 300); // 5 minutes
        }
        if (current > 750) {
          const ttl = await redis.ttl(RATE_LIMIT_KEY);
          throw new AppError(`Delhivery tracking rate limit exceeded. Try again in ${ttl} seconds.`, 429, 'DELHIVERY_RATE_LIMITED');
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn({ err: err.message }, 'Redis rate limit check failed, proceeding anyway.');
    }

    try {
      const delhiveryClient = createDelhiveryClient();
      const response = await delhiveryClient.get('/api/v1/packages/json/', {
        params: { waybill: uniqueWaybills.join(',') }
      });
      
      const results = [];
      const shipmentDataArray = response.data.ShipmentData || [];
      
      for (const data of shipmentDataArray) {
        const trackingData = data.Shipment;
        if (!trackingData || !trackingData.AWB) continue;

        const events = (trackingData.Scans || []).map(scan => ({
          date: scan.ScanDateTime,
          status: scan.ScanType,
          location: scan.ScannedLocation
        }));

        results.push({
          awb: trackingData.AWB,
          status: trackingData.Status?.Status,
          rawStatus: trackingData.Status?.StatusType || trackingData.Status?.Status,
          currentLocation: trackingData.Status?.StatusLocation,
          instructions: trackingData.Status?.Instructions,
          events
        });
      }

      return Array.isArray(trackingNumberOrArray) ? results : (results[0] || null);
    } catch (error) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout') || !error.response;
      const isRateLimited = error.response?.status === 429;
      
      logger.error({ 
        err: error.message, 
        waybills: uniqueWaybills.length > 5 ? `${uniqueWaybills.length} waybills` : uniqueWaybills,
        isTimeout,
        isRateLimited
      }, 'Delhivery Tracking API Error');
      
      const statusCode = error.response?.status || (error.statusCode || (isTimeout ? 504 : 500));
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to communicate with Delhivery Tracking API';
      const errorCode = isTimeout ? 'DELHIVERY_TRACKING_TIMEOUT' : (isRateLimited ? 'DELHIVERY_RATE_LIMITED' : 'DELHIVERY_TRACKING_FAILED');
      
      const appErr = new AppError(`Delhivery Tracking error: ${errMsg}`, statusCode, errorCode);
      appErr.errorCode = errorCode;
      appErr.isAmbiguous = isTimeout;
      throw appErr;
    }
  },

  /**
   * Bulk Waybill Generation / Fetching
   * Endpoint: GET /waybill/api/bulk/json/?count={count}
   * Note: Does NOT use automatic retries to prevent duplicate bulk waybill generation.
   */
  async fetchBulkWaybills(count) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot fetch bulk waybills in production.', 500);
    }
    const delhiveryClient = createDelhiveryClient();
    try {
      const response = await delhiveryClient.get('/waybill/api/bulk/json/', {
        params: { count }
      });
      return response.data;
    } catch (error) {
      const sanitizedMessage = error.message ? error.message.replace(new RegExp(getToken() || '', 'g'), '***') : '';
      logger.error({ err: sanitizedMessage, count }, 'Delhivery Bulk Waybill API Error');
      const statusCode = error.response?.status || (error.statusCode || 500);
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to communicate with Delhivery Bulk Waybill API';
      throw new AppError(`Delhivery Bulk Waybill API error: ${errMsg}`, statusCode);
    }
  },

  /**
   * Shipment Updation / Edit API
   * Endpoint: POST /api/p/edit
   * Updates shipment details associated with an existing Delhivery waybill.
   */
  async editShipment(waybill, updates = {}) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot edit shipment in production.', 500);
    }
    const cleanWaybill = String(waybill || '').trim();
    if (!cleanWaybill) {
      throw new AppError('A valid waybill is required to edit a shipment.', 400, 'INVALID_WAYBILL');
    }

    // Explicit allowlist of editable fields (strictly excluding cod, since Cravo does not use COD)
    const ALLOWED_EDIT_FIELDS = [
      'name',
      'phone',
      'pin',
      'city',
      'state',
      'address',
      'product_details',
      'weight',
      'shipment_length',
      'shipment_width',
      'shipment_height'
    ];

    // Check for disallowed/unsupported fields (specifically cod or arbitrary keys)
    const providedKeys = Object.keys(updates);
    const disallowedKeys = providedKeys.filter(k => !ALLOWED_EDIT_FIELDS.includes(k));
    if (disallowedKeys.length > 0) {
      throw new AppError(
        `Unsupported field(s) in shipment edit: ${disallowedKeys.join(', ')}. Cravo does not support COD or arbitrary fields.`,
        400,
        'UNSUPPORTED_FIELDS'
      );
    }

    const payload = { waybill: cleanWaybill };
    const appliedFields = [];

    for (const key of ALLOWED_EDIT_FIELDS) {
      if (updates[key] !== undefined && updates[key] !== null) {
        if (key === 'pin') {
          const cleanPin = String(updates.pin).trim();
          if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
            throw new AppError('Invalid pincode. Must be a valid 6-digit Indian PIN code starting with digits 1-9.', 400, 'INVALID_PINCODE');
          }
          payload.pin = cleanPin;
        } else {
          payload[key] = updates[key];
        }
        appliedFields.push(key);
      }
    }

    if (appliedFields.length === 0) {
      throw new AppError('At least one editable field must be provided.', 400, 'NO_EDIT_FIELDS');
    }

    // Never use blind retries for POST /api/p/edit because Delhivery may have processed the edit
    const delhiveryClient = createDelhiveryClient();
    try {
      const response = await delhiveryClient.post('/api/p/edit', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;
      const isSuccess = data?.status === true || data?.success === true || (typeof data === 'string' && data.toLowerCase().includes('success'));
      if (!isSuccess && data?.status !== undefined) {
        const errorMsg = data?.error || data?.remark || data?.message || JSON.stringify(data);
        throw new AppError(`Delhivery Shipment Edit rejected: ${errorMsg}`, 400);
      }

      logger.info(
        { waybill: cleanWaybill, updatedFields: appliedFields },
        'Successfully edited Delhivery shipment'
      );

      return {
        success: true,
        waybill: cleanWaybill,
        updatedFields: appliedFields,
        remark: data?.remark || 'Shipment updated successfully'
      };
    } catch (error) {
      const sanitizedMessage = error.message ? error.message.replace(new RegExp(getToken() || '', 'g'), '***') : '';
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout') || !error.response;

      logger.error(
        { 
          err: sanitizedMessage, 
          waybill: cleanWaybill, 
          isTimeout, 
          updatedFields: appliedFields 
        }, 
        'Delhivery Shipment Edit API Error'
      );

      const statusCode = error.response?.status || (error.statusCode || (isTimeout ? 504 : 500));
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.remark || error.message || 'Failed to communicate with Delhivery Shipment Edit API';
      const appErr = new AppError(`Delhivery Shipment Edit error: ${errMsg}`, statusCode, isTimeout ? 'DELHIVERY_EDIT_TIMEOUT' : 'DELHIVERY_EDIT_FAILED');
      appErr.isAmbiguous = isTimeout;
      throw appErr;
    }
  },

  /**
   * Shipment Cancellation API
   * Endpoint: POST /api/p/edit
   * Payload: { waybill: "<WAYBILL>", cancellation: "true" }
   * Note: Cravo is 100% non-COD. Only waybill and cancellation: "true" are sent.
   */
  async cancelShipment(waybill, options = {}) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot cancel shipment in production.', 500);
    }
    const cleanWaybill = String(waybill || '').trim();
    if (!cleanWaybill) {
      throw new AppError('A valid waybill is required to cancel a shipment.', 400, 'INVALID_WAYBILL');
    }

    // Reject COD if client passes cod
    if (options && 'cod' in options) {
      throw new AppError('Cravo does not support COD. The cod field cannot be supplied.', 400, 'COD_NOT_SUPPORTED');
    }

    // Cancellation payload MUST contain only waybill and cancellation: "true"
    const payload = {
      waybill: cleanWaybill,
      cancellation: 'true'
    };

    // Never use blind retries for POST /api/p/edit cancellation
    const delhiveryClient = createDelhiveryClient();
    try {
      const response = await delhiveryClient.post('/api/p/edit', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;
      const isSuccess = data?.status === true || data?.success === true || (typeof data === 'string' && data.toLowerCase().includes('success'));
      if (!isSuccess && data?.status !== undefined) {
        const errorMsg = data?.error || data?.remark || data?.message || JSON.stringify(data);
        throw new AppError(`Delhivery Shipment Cancellation rejected: ${errorMsg}`, 400);
      }

      logger.info(
        { waybill: cleanWaybill },
        'Successfully cancelled Delhivery shipment'
      );

      return {
        success: true,
        waybill: cleanWaybill,
        cancellationRequested: true,
        remark: data?.remark || 'Shipment cancelled successfully'
      };
    } catch (error) {
      const sanitizedMessage = error.message ? error.message.replace(new RegExp(getToken() || '', 'g'), '***') : '';
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout') || !error.response;

      logger.error(
        {
          err: sanitizedMessage,
          waybill: cleanWaybill,
          isTimeout
        },
        'Delhivery Shipment Cancellation API Error'
      );

      const statusCode = error.response?.status || (error.statusCode || (isTimeout ? 504 : 500));
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.remark || error.message || 'Failed to communicate with Delhivery Shipment Cancellation API';
      const appErr = new AppError(`Delhivery Shipment Cancellation error: ${errMsg}`, statusCode, isTimeout ? 'DELHIVERY_CANCEL_TIMEOUT' : 'DELHIVERY_CANCEL_FAILED');
      appErr.isAmbiguous = isTimeout;
      throw appErr;
    }
  },

  /**
   * E-Waybill Update API
   * Endpoint: PUT /api/rest/ewaybill/{waybill}/
   * Updates forward e-waybill for forward shipments or return e-waybill for return shipments.
   * Documented rate limit: 250 requests / 5 minutes / IP.
   */
  async updateEwaybill({ waybill, dcn, ewbn }) {
    if (!getToken()) {
      throw new AppError('Delhivery API key missing. Cannot update e-waybill in production.', 500);
    }
    const cleanWaybill = String(waybill || '').trim();
    if (!cleanWaybill) {
      throw new AppError('A valid waybill is required to update an e-waybill.', 400, 'INVALID_WAYBILL');
    }

    const cleanDcn = String(dcn || '').trim();
    const cleanEwbn = String(ewbn || '').trim();

    if (!cleanDcn) {
      throw new AppError('Document / Invoice Number (dcn) is required.', 400, 'INVALID_DCN');
    }
    if (!cleanEwbn) {
      throw new AppError('E-Waybill Number (ewbn) is required.', 400, 'INVALID_EWBN');
    }

    const payload = {
      data: [
        {
          dcn: cleanDcn,
          ewbn: cleanEwbn
        }
      ]
    };

    const delhiveryClient = createDelhiveryClient();
    try {
      // Do not use blind retries because this PUT updates external courier state
      const response = await delhiveryClient.put(`/api/rest/ewaybill/${encodeURIComponent(cleanWaybill)}/`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;
      const isSuccess = data?.status === true || 
                        data?.success === true || 
                        (Array.isArray(data?.data) && data.data.length > 0) || 
                        (typeof data === 'string' && data.toLowerCase().includes('success'));

      if (!isSuccess && data?.status !== undefined) {
        const errorMsg = data?.error || data?.remark || data?.message || JSON.stringify(data);
        throw new AppError(`Delhivery E-Waybill Update rejected: ${errorMsg}`, 400);
      }

      logger.info(
        { waybill: cleanWaybill, dcn: cleanDcn },
        'Successfully updated Delhivery e-waybill'
      );

      return {
        success: true,
        waybill: cleanWaybill,
        dcn: cleanDcn,
        ewbn: cleanEwbn,
        remark: data?.remark || data?.message || 'E-Waybill updated successfully',
        rawData: data
      };
    } catch (error) {
      const sanitizedMessage = error.message ? error.message.replace(new RegExp(getToken() || '', 'g'), '***') : '';
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout') || !error.response;
      const isRateLimited = error.response?.status === 429;

      logger.error(
        {
          err: sanitizedMessage,
          waybill: cleanWaybill,
          dcn: cleanDcn,
          isTimeout,
          isRateLimited
        },
        'Delhivery E-Waybill Update API Error'
      );

      const statusCode = error.response?.status || (error.statusCode || (isTimeout ? 504 : 500));
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.remark || error.message || 'Failed to communicate with Delhivery E-Waybill Update API';
      const errorCode = isTimeout ? 'DELHIVERY_EWAYBILL_TIMEOUT' : (isRateLimited ? 'DELHIVERY_RATE_LIMITED' : 'DELHIVERY_EWAYBILL_FAILED');
      const appErr = new AppError(`Delhivery E-Waybill Update error: ${errMsg}`, statusCode, errorCode);
      appErr.errorCode = errorCode;
      appErr.isAmbiguous = isTimeout;
      throw appErr;
    }
  },

  /**
   * Fetch shipment tracking data from Delhivery for one or more AWBs.
   * @param {string|string[]} waybills - single AWB or array of AWBs (max 50)
   * @returns {Array<{awb, status, rawStatus, currentLocation, events}>}
   */
  async trackShipment(waybills) {
    const token = getToken();
    if (!token) {
      throw new AppError('Delhivery API key missing. Cannot track shipment.', 500);
    }

    const waybillList = Array.isArray(waybills) ? waybills : [waybills];
    if (waybillList.length === 0) return [];

    // Delhivery supports up to 50 AWBs per request
    const chunk = waybillList.slice(0, 50);
    const waybillParam = chunk.join(',');

    const delhiveryClient = createDelhiveryClient();

    try {
      const response = await fetchWithRetry(() =>
        delhiveryClient.get('/api/v1/packages/json/', {
          params: { waybill: waybillParam },
          headers: { 'Authorization': `Token ${token}` }
        })
      );

      const data = response.data;
      // Delhivery returns { ShipmentData: [ { Shipment: {...} }, ... ] }
      const shipmentData = data?.ShipmentData;
      if (!Array.isArray(shipmentData)) {
        logger.warn({ waybills: chunk }, '[trackShipment] Unexpected Delhivery tracking response shape');
        return [];
      }

      return shipmentData.map((entry) => {
        const shipment = entry?.Shipment || {};
        const scans = Array.isArray(shipment.Scans) ? shipment.Scans : [];

        const events = scans.map((scan) => ({
          status: scan.ScanDetail?.Scan || scan.ScanDetail?.Instructions || '',
          location: scan.ScanDetail?.ScannedLocation || scan.CityName || '',
          date: scan.ScanDetail?.ScanDateTime || scan.ScanDetail?.StatusDateTime || null,
          rawScan: scan.ScanDetail?.Scan || '',
          instructions: scan.ScanDetail?.Instructions || ''
        }));

        return {
          awb: shipment.AWB || '',
          status: shipment.Status?.Status || '',
          rawStatus: shipment.Status?.Status || '',
          currentLocation: shipment.Status?.City || shipment.PickUpDate || '',
          expectedDeliveryDate: shipment.ExpectedDeliveryDate || null,
          events
        };
      });
    } catch (error) {
      const isTimeout = error.code === 'ECONNABORTED' || !error.response;
      const sanitizedMessage = error.message
        ? error.message.replace(new RegExp(token || '', 'g'), '***')
        : '';

      logger.error(
        { err: sanitizedMessage, waybills: chunk, isTimeout },
        'Delhivery Shipment Tracking API Error'
      );

      const statusCode = error.response?.status || (isTimeout ? 504 : 500);
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to communicate with Delhivery Tracking API';
      const errorCode = isTimeout ? 'DELHIVERY_TRACKING_TIMEOUT' : 'DELHIVERY_TRACKING_FAILED';
      const appErr = new AppError(`Delhivery Tracking error: ${errMsg}`, statusCode, errorCode);
      appErr.isAmbiguous = isTimeout;
      throw appErr;
    }
  }
};



