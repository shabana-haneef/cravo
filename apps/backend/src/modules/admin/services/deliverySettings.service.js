import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '..', '..', '..', 'config', 'deliverySettings.json');

const DEFAULT_SETTINGS = {
  enableDeliveryOrders: true,
  enablePickupOrders: true,
  enableScheduledDeliveries: false,
  restrictOutsideKerala: true,
  allowFutureStateExpansion: false,
  enableDeliveryCharges: true,
  defaultDeliveryCharge: 50,
  freeDeliveryThreshold: 499,
  allowPromotionalFreeDelivery: true,
  expectedDispatchTime: '24 Hours',
  standardDeliveryTime: '1-3 Business Days',
  remoteAreaDeliveryTime: '3-5 Business Days',
  displayEstimatesToCustomers: true,
  defaultSellerPrepTime: '24 Hours',
  maxSellerPrepTime: '72 Hours',
  autoCancelUnfulfilledOrders: false,
  autoCancelWindowDays: 7,
  autoCreateShipment: true,
  autoSyncTracking: true,
  trackingSyncIntervalMins: 30,
  enablePickupVerification: true,
  requirePickupOtp: true,
  pickupExpiryWindowHours: 24,
  requireVerifiedAddress: true,
  requireDefaultAddress: true,
  allowAddressChanges: false,
  maxAddressModificationWindowMins: 30
};

export const deliverySettingsService = {
  async get() {
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      console.error('Failed to read delivery settings file:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
      return settings;
    } catch (error) {
      console.error('Failed to save delivery settings file:', error);
      throw error;
    }
  },

  validate(settings) {
    const errors = [];

    // Delivery charges and thresholds
    if (typeof settings.defaultDeliveryCharge !== 'number' || settings.defaultDeliveryCharge < 0 || settings.defaultDeliveryCharge > 1000) {
      errors.push('Default Delivery Charge must be between ₹0 and ₹1000.');
    }

    if (typeof settings.freeDeliveryThreshold !== 'number' || settings.freeDeliveryThreshold < 0) {
      errors.push('Free Delivery Threshold must be a non-negative number.');
    }

    if (settings.freeDeliveryThreshold <= settings.defaultDeliveryCharge) {
      errors.push('Free Delivery Threshold must be greater than the Default Delivery Charge.');
    }

    // Tracking Sync Interval (5 Minutes - 24 Hours)
    if (typeof settings.trackingSyncIntervalMins !== 'number' || settings.trackingSyncIntervalMins < 5 || settings.trackingSyncIntervalMins > 1440) {
      errors.push('Tracking Sync Interval must be between 5 minutes and 24 hours (1440 minutes).');
    }

    // Prepare prep/cancellation times are positive numbers where applicable
    if (settings.autoCancelUnfulfilledOrders) {
      if (typeof settings.autoCancelWindowDays !== 'number' || settings.autoCancelWindowDays < 1) {
        errors.push('Auto Cancel Window must be at least 1 day.');
      }
    }

    if (settings.allowAddressChanges) {
      if (typeof settings.maxAddressModificationWindowMins !== 'number' || settings.maxAddressModificationWindowMins < 1) {
        errors.push('Maximum Address Modification Window must be at least 1 minute.');
      }
    }

    if (typeof settings.pickupExpiryWindowHours !== 'number' || settings.pickupExpiryWindowHours < 1) {
      errors.push('Pickup Expiry Window must be at least 1 hour.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
