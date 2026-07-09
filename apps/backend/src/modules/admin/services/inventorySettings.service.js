import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../shared/services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '..', '..', '..', 'config', 'inventorySettings.json');

const DEFAULT_SETTINGS = {
  enableLowStockAlerts: true,
  defaultLowStockThreshold: 10,
  criticalStockThreshold: 5,
  enableStockReservation: true,
  reservationExpiryTime: 30, // Minutes
  autoReleaseExpiredReservations: true,
  allowPurchaseWhenOutOfStock: false,
  showOutOfStockProducts: true,
  hideProductsAfterStockReachesZero: false,
  allowSellerInventoryUpdates: true,
  requireInventoryChangeLogging: true,
  requireReasonForManualAdjustment: true,
  trackVariantInventorySeparately: true,
  preventOversellingVariants: true,
  requireVariantStockBeforeListing: true,
  enableLowStockNotifications: true,
  enableCriticalStockNotifications: true,
  notificationFrequency: 'Instant', // 'Instant', 'Daily', 'Weekly'
  enableInventoryLogs: true,
  logRetentionPeriod: 365, // Days
  validateStockBeforePaymentVerification: true,
  // Hardcoded Protection Rules (Always True/ON)
  preventNegativeStock: true,
  preventOverselling: true,
  blockOrdersWithInsufficientStock: true
};

import { z } from 'zod';

const inventorySettingsSchema = z.object({
  enableLowStockAlerts: z.boolean(),
  defaultLowStockThreshold: z.number().min(1, 'Default Low Stock Threshold must be between 1 and 1000.').max(1000),
  criticalStockThreshold: z.number().min(0, 'Critical Stock Threshold must be a non-negative number.'),
  enableStockReservation: z.boolean(),
  reservationExpiryTime: z.number().min(1, 'Reservation Expiry Time must be between 1 and 1440 minutes.').max(1440),
  autoReleaseExpiredReservations: z.boolean(),
  allowPurchaseWhenOutOfStock: z.boolean(),
  showOutOfStockProducts: z.boolean(),
  hideProductsAfterStockReachesZero: z.boolean(),
  allowSellerInventoryUpdates: z.boolean(),
  requireInventoryChangeLogging: z.boolean(),
  requireReasonForManualAdjustment: z.boolean(),
  trackVariantInventorySeparately: z.boolean(),
  preventOversellingVariants: z.boolean(),
  requireVariantStockBeforeListing: z.boolean(),
  enableLowStockNotifications: z.boolean(),
  enableCriticalStockNotifications: z.boolean(),
  notificationFrequency: z.enum(['Instant', 'Daily', 'Weekly'], { errorMap: () => ({ message: "Notification Frequency must be one of: 'Instant', 'Daily', 'Weekly'." }) }),
  enableInventoryLogs: z.boolean(),
  logRetentionPeriod: z.number().min(1, 'Log Retention Period must be a positive number.'),
  validateStockBeforePaymentVerification: z.boolean(),
  // Hardcoded rules
  preventNegativeStock: z.boolean().optional(),
  preventOverselling: z.boolean().optional(),
  blockOrdersWithInsufficientStock: z.boolean().optional()
}).strict()
.refine(data => data.criticalStockThreshold < data.defaultLowStockThreshold, {
  message: "Critical Stock Threshold must be lower than low stock threshold."
});

export const inventorySettingsService = {
  async get() {
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Force hardcoded protection rules to always be true
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed, 
        preventNegativeStock: true,
        preventOverselling: true,
        blockOrdersWithInsufficientStock: true 
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      logger.error({ err: error }, 'Failed to read inventory settings file');
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      const parsed = inventorySettingsSchema.parse(settings);
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      // Enforce hardcoded rules upon save
      const finalSettings = {
        ...parsed,
        preventNegativeStock: true,
        preventOverselling: true,
        blockOrdersWithInsufficientStock: true
      };
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(finalSettings, null, 2), 'utf-8');
      return finalSettings;
    } catch (error) {
      logger.error({ err: error }, 'Failed to save inventory settings file');
      throw error;
    }
  },

  validate(settings) {
    const parsed = inventorySettingsSchema.safeParse(settings);
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
