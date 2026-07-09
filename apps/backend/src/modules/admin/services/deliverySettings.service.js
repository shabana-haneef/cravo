import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../shared/services/logger.js';

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

import { z } from 'zod';

const deliverySettingsSchema = z.object({
  enableDeliveryOrders: z.boolean(),
  enablePickupOrders: z.boolean(),
  enableScheduledDeliveries: z.boolean(),
  restrictOutsideKerala: z.boolean(),
  allowFutureStateExpansion: z.boolean(),
  enableDeliveryCharges: z.boolean(),
  defaultDeliveryCharge: z.number().min(0, 'Default Delivery Charge must be between ₹0 and ₹1000.').max(1000),
  freeDeliveryThreshold: z.number().min(0, 'Free Delivery Threshold must be a non-negative number.'),
  allowPromotionalFreeDelivery: z.boolean(),
  expectedDispatchTime: z.string(),
  standardDeliveryTime: z.string(),
  remoteAreaDeliveryTime: z.string(),
  displayEstimatesToCustomers: z.boolean(),
  defaultSellerPrepTime: z.string(),
  maxSellerPrepTime: z.string(),
  autoCancelUnfulfilledOrders: z.boolean(),
  autoCancelWindowDays: z.number().min(1, 'Auto Cancel Window must be at least 1 day.').optional(),
  autoCreateShipment: z.boolean(),
  autoSyncTracking: z.boolean(),
  trackingSyncIntervalMins: z.number().min(5, 'Tracking Sync Interval must be between 5 minutes and 24 hours (1440 minutes).').max(1440),
  enablePickupVerification: z.boolean(),
  requirePickupOtp: z.boolean(),
  pickupExpiryWindowHours: z.number().min(1, 'Pickup Expiry Window must be at least 1 hour.'),
  requireVerifiedAddress: z.boolean(),
  requireDefaultAddress: z.boolean(),
  allowAddressChanges: z.boolean(),
  maxAddressModificationWindowMins: z.number().min(1, 'Maximum Address Modification Window must be at least 1 minute.').optional()
}).strict()
.refine(data => data.freeDeliveryThreshold > data.defaultDeliveryCharge, {
  message: "Free Delivery Threshold must be greater than the Default Delivery Charge."
});

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
      logger.error({ err: error }, 'Failed to read delivery settings file');
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      // Validate and parse through Zod to drop arbitrary keys and enforce types
      const parsed = deliverySettingsSchema.parse(settings);
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      return parsed;
    } catch (error) {
      logger.error({ err: error }, 'Failed to save delivery settings file');
      throw error;
    }
  },

  validate(settings) {
    const parsed = deliverySettingsSchema.safeParse(settings);
    if (!parsed.success) {
      return {
        isValid: false,
        errors: parsed.error.errors.map(e => e.message)
      };
    }
    return {
      isValid: true,
      errors: []
    };
  }
};
