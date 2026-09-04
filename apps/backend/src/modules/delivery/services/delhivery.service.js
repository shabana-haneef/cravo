import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';

import { delhiveryShipmentService } from './delhiveryShipmentService.js';

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
    const token = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY;
    if (!token) {
      logger.warn('Delhivery API key missing. Using mock responses.');
      return null;
    }
    return {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    };
  },

  async createShipment(order, pickupAddress, deliveryAddress) {
    const seller = {
      pickupLocationName: pickupAddress.fullName || pickupAddress.locationName || 'Main Store',
      pickupAddress: pickupAddress.addressLine1 || pickupAddress.streetAddress || '',
      pickupCity: pickupAddress.city || '',
      pickupState: pickupAddress.state || '',
      pickupPincode: pickupAddress.postalCode || pickupAddress.pincode || '',
      pickupPhone: pickupAddress.phone || ''
    };
    return delhiveryShipmentService.createShipment(order, seller, deliveryAddress);
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
