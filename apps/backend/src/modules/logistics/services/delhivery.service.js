import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';

// Delhivery Service wrapper for official APIs
// For standard B2C / Hyperlocal usage
export const delhiveryService = {
  getBaseUrl() {
    // Sandbox or Prod depending on environment
    return process.env.DELHIVERY_ENV === 'prod' 
      ? 'https://track.delhivery.com' 
      : 'https://staging-express.delhivery.com';
  },

  getHeaders() {
    if (!process.env.DELHIVERY_API_KEY) {
      logger.warn('Delhivery API key missing. Using mock responses.');
      return null;
    }
    return {
      'Authorization': `Token ${process.env.DELHIVERY_API_KEY}`,
      'Content-Type': 'application/json'
    };
  },

  async createShipment(order, pickupAddress, deliveryAddress) {
    const headers = this.getHeaders();
    if (!headers) {
      // Return a mock payload if no key exists
      return {
        trackingNumber: `MOCK_TRK_${order.orderNumber}`,
        shipmentId: `MOCK_SHP_${Date.now()}`,
        status: 'BOOKED'
      };
    }

    try {
      const payload = {
        format: 'json',
        data: {
          shipments: [
            {
              name: deliveryAddress.fullName,
              add: deliveryAddress.addressLine1 + ' ' + (deliveryAddress.addressLine2 || ''),
              pin: deliveryAddress.postalCode,
              city: deliveryAddress.city,
              state: deliveryAddress.state,
              country: 'India',
              phone: deliveryAddress.phone,
              order: order.orderNumber,
              payment_mode: order.payments[0]?.amount > 0 ? 'Pre-paid' : 'COD', // Simplification
              return_pin: pickupAddress.postalCode,
              return_city: pickupAddress.city,
              return_phone: pickupAddress.phone,
              return_add: pickupAddress.addressLine1,
              return_state: pickupAddress.state,
              return_country: 'India'
            }
          ],
          pickup_location: {
            name: pickupAddress.fullName,
            add: pickupAddress.addressLine1,
            city: pickupAddress.city,
            pin: pickupAddress.postalCode,
            country: 'India',
            phone: pickupAddress.phone
          }
        }
      };

      // Delhivery shipment creation endpoint
      const response = await axios.post(`${this.getBaseUrl()}/api/cmu/create.json`, payload, { headers });
      
      if (response.data.success) {
        const pkg = response.data.packages[0];
        return {
          trackingNumber: pkg.waybill,
          shipmentId: pkg.refnum,
          status: 'BOOKED'
        };
      } else {
        throw new AppError("Delhivery: Failed to create shipment. " + JSON.stringify(response.data.rmk), 500);
      }
    } catch (error) {
      logger.error({ err: error.message }, 'Delhivery API Error');
      throw new AppError("Failed to communicate with delivery partner", 500);
    }
  },

  async trackShipment(trackingNumber) {
    const headers = this.getHeaders();
    if (!headers) {
      return {
        status: 'IN_TRANSIT',
        events: [{ date: new Date().toISOString(), status: 'In Transit', location: 'Mock Hub' }]
      };
    }

    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/v1/packages/json/`, {
        headers,
        params: { waybill: trackingNumber, token: process.env.DELHIVERY_API_KEY }
      });

      const trackingData = response.data.ShipmentData?.[0]?.Shipment;
      if (!trackingData) return null;

      // Map Delhivery status to our internal Enums
      const statusMap = {
        'Manifested': 'BOOKED',
        'In Transit': 'IN_TRANSIT',
        'Pending': 'PENDING',
        'Dispatched': 'OUT_FOR_DELIVERY',
        'Delivered': 'DELIVERED',
        'RTO': 'RETURNED',
        'Canceled': 'CANCELLED'
      };

      return {
        status: statusMap[trackingData.Status.Status] || 'IN_TRANSIT',
        events: trackingData.Scans.map(scan => ({
          date: scan.ScanDateTime,
          status: scan.ScanType,
          location: scan.ScannedLocation
        }))
      };
    } catch (error) {
      logger.error({ err: error.message, trackingNumber }, 'Delhivery Tracking Error');
      return null; // Return null so cron job doesn't fail
    }
  },

  async cancelShipment(trackingNumber) {
    const headers = this.getHeaders();
    if (!headers) return true; // Mock success

    try {
      const payload = {
        waybill: trackingNumber,
        cancellation: true
      };
      const response = await axios.post(`${this.getBaseUrl()}/api/p/edit`, payload, { headers });
      return response.data.status === true;
    } catch (error) {
      logger.error({ err: error.message, trackingNumber }, 'Delhivery Cancel Error');
      return false;
    }
  }
};
