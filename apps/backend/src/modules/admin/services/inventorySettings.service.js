import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
      console.error('Failed to read inventory settings file:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      // Enforce hardcoded rules upon save
      const finalSettings = {
        ...settings,
        preventNegativeStock: true,
        preventOverselling: true,
        blockOrdersWithInsufficientStock: true
      };
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(finalSettings, null, 2), 'utf-8');
      return finalSettings;
    } catch (error) {
      console.error('Failed to save inventory settings file:', error);
      throw error;
    }
  },

  validate(settings) {
    const errors = [];

    // Low Stock Configuration
    if (typeof settings.enableLowStockAlerts !== 'boolean') {
      errors.push("Field 'enableLowStockAlerts' must be a boolean.");
    }
    const defaultLowStockThreshold = Number(settings.defaultLowStockThreshold);
    if (isNaN(defaultLowStockThreshold) || defaultLowStockThreshold < 1 || defaultLowStockThreshold > 1000) {
      errors.push("Default Low Stock Threshold must be between 1 and 1000.");
    }
    const criticalStockThreshold = Number(settings.criticalStockThreshold);
    if (isNaN(criticalStockThreshold) || criticalStockThreshold < 0) {
      errors.push("Critical Stock Threshold must be a non-negative number.");
    }
    if (criticalStockThreshold >= defaultLowStockThreshold) {
      errors.push("Critical Stock Threshold must be lower than low stock threshold.");
    }

    // Reservation Rules
    if (typeof settings.enableStockReservation !== 'boolean') {
      errors.push("Field 'enableStockReservation' must be a boolean.");
    }
    const reservationExpiryTime = Number(settings.reservationExpiryTime);
    if (isNaN(reservationExpiryTime) || reservationExpiryTime < 1 || reservationExpiryTime > 1440) {
      errors.push("Reservation Expiry Time must be between 1 and 1440 minutes.");
    }
    if (typeof settings.autoReleaseExpiredReservations !== 'boolean') {
      errors.push("Field 'autoReleaseExpiredReservations' must be a boolean.");
    }

    // Out of Stock Rules
    if (typeof settings.allowPurchaseWhenOutOfStock !== 'boolean') {
      errors.push("Field 'allowPurchaseWhenOutOfStock' must be a boolean.");
    }
    if (typeof settings.showOutOfStockProducts !== 'boolean') {
      errors.push("Field 'showOutOfStockProducts' must be a boolean.");
    }
    if (typeof settings.hideProductsAfterStockReachesZero !== 'boolean') {
      errors.push("Field 'hideProductsAfterStockReachesZero' must be a boolean.");
    }

    // Seller Controls
    if (typeof settings.allowSellerInventoryUpdates !== 'boolean') {
      errors.push("Field 'allowSellerInventoryUpdates' must be a boolean.");
    }
    if (typeof settings.requireInventoryChangeLogging !== 'boolean') {
      errors.push("Field 'requireInventoryChangeLogging' must be a boolean.");
    }
    if (typeof settings.requireReasonForManualAdjustment !== 'boolean') {
      errors.push("Field 'requireReasonForManualAdjustment' must be a boolean.");
    }

    // Variant Settings
    if (typeof settings.trackVariantInventorySeparately !== 'boolean') {
      errors.push("Field 'trackVariantInventorySeparately' must be a boolean.");
    }
    if (typeof settings.preventOversellingVariants !== 'boolean') {
      errors.push("Field 'preventOversellingVariants' must be a boolean.");
    }
    if (typeof settings.requireVariantStockBeforeListing !== 'boolean') {
      errors.push("Field 'requireVariantStockBeforeListing' must be a boolean.");
    }

    // Alerts
    if (typeof settings.enableLowStockNotifications !== 'boolean') {
      errors.push("Field 'enableLowStockNotifications' must be a boolean.");
    }
    if (typeof settings.enableCriticalStockNotifications !== 'boolean') {
      errors.push("Field 'enableCriticalStockNotifications' must be a boolean.");
    }
    if (!['Instant', 'Daily', 'Weekly'].includes(settings.notificationFrequency)) {
      errors.push("Notification Frequency must be one of: 'Instant', 'Daily', 'Weekly'.");
    }

    // Transaction Logs
    if (typeof settings.enableInventoryLogs !== 'boolean') {
      errors.push("Field 'enableInventoryLogs' must be a boolean.");
    }
    const logRetentionPeriod = Number(settings.logRetentionPeriod);
    if (isNaN(logRetentionPeriod) || logRetentionPeriod <= 0) {
      errors.push("Log Retention Period must be a positive number.");
    }

    // Protection
    if (typeof settings.validateStockBeforePaymentVerification !== 'boolean') {
      errors.push("Field 'validateStockBeforePaymentVerification' must be a boolean.");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
