import axios from 'axios';
import { logger } from '../shared/services/logger.js';
import { AppError } from '../shared/errors/AppError.js';

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
  async createShipment(order, seller, deliveryAddress) {
    if (!getToken()) {
      // Return a mock payload if no key exists (useful for development)
      logger.warn('Delhivery API key missing. Generating mock AWB.');
      return {
        success: true,
        trackingNumber: `MOCK_AWB_${order.orderNumber}_${Date.now().toString().slice(-4)}`,
        shipmentId: `MOCK_SHP_${Date.now()}`,
        status: 'BOOKED',
        remarks: 'Mock shipment created'
      };
    }
    const delhiveryClient = createDelhiveryClient();

    const payloadData = {
      shipments: [
        {
          name: deliveryAddress.fullName,
          add: `${deliveryAddress.addressLine1} ${deliveryAddress.addressLine2 || ''}`.trim(),
          pin: deliveryAddress.postalCode,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          country: 'India',
          phone: deliveryAddress.phone,
          order: order.orderNumber,
          payment_mode: order.payments?.length > 0 ? 'Pre-paid' : 'COD',
          return_pin: seller.pickupPincode,
          return_city: seller.pickupCity,
          return_phone: seller.pickupPhone,
          return_add: seller.pickupAddress,
          return_state: seller.pickupState,
          return_country: 'India'
        }
      ],
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

  async trackShipment(trackingNumber) {
    if (!getToken()) {
      // Mock tracking response
      let status = 'IN_TRANSIT';
      if (trackingNumber.includes('DELIVERED')) status = 'DELIVERED';
      else if (trackingNumber.includes('CANCEL')) status = 'CANCELLED';
      else if (trackingNumber.includes('RTO')) status = 'RETURNED';
      else if (trackingNumber.includes('OUT')) status = 'OUT_FOR_DELIVERY';

      return {
        status,
        events: [
          { date: new Date().toISOString(), status: 'Manifested', location: 'Kochi Hub' },
          { date: new Date().toISOString(), status: 'In Transit', location: 'Ernakulam Gateway' }
        ]
      };
    }

    try {
      const delhiveryClient = createDelhiveryClient();
      // Delhivery tracking API endpoint is /api/v1/packages/json/
      const response = await delhiveryClient.get('/api/v1/packages/json/', {
        params: { waybill: trackingNumber }
      });
      const trackingData = response.data.ShipmentData?.[0]?.Shipment;
      if (!trackingData) return null;

      const statusMap = {
        'Manifested': 'BOOKED',
        'In Transit': 'IN_TRANSIT',
        'Pending': 'PENDING',
        'Dispatched': 'OUT_FOR_DELIVERY',
        'Delivered': 'DELIVERED',
        'RTO': 'RETURNED',
        'Canceled': 'CANCELLED'
      };

      const status = statusMap[trackingData.Status.Status] || 'IN_TRANSIT';
      const events = (trackingData.Scans || []).map(scan => ({
        date: scan.ScanDateTime,
        status: scan.ScanType,
        location: scan.ScannedLocation
      }));

      return { status, events };
    } catch (error) {
      logger.error({ err: error.message, trackingNumber }, 'Delhivery Tracking API Error');
      return null;
    }
  }
};
