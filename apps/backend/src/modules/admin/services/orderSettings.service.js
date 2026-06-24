import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '..', '..', '..', 'config', 'orderSettings.json');

const DEFAULT_SETTINGS = {
  autoCancelUnconfirmedMins: 30,
  autoCompleteDeliveredDays: 7,
  allowCustomerCancellation: true,
  customerCancellationWindowMins: 30,
  allowedTransitions: {
    'PLACED': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['PREPARING'],
    'PREPARING': ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
    'READY_FOR_PICKUP': ['DELIVERED'],
    'OUT_FOR_DELIVERY': ['DELIVERED']
  },
  minOrderValue: 50,
  maxOrderValue: 50000,
  maxItemsPerOrder: 100,
  maxQtyPerProduct: 20,
  requireVerifiedEmail: false,
  requireActiveAddress: false,
  blockSuspendedUsers: true,
  allowGuestOrders: false,
  autoExpireSellerAcceptanceMins: 60,
  sellerAcceptanceAction: 'CANCEL', // 'CANCEL' or 'ESCALATE'
  allowRefundRequests: true,
  refundRequestWindowDays: 7,
  requireAdminRefundApproval: true
};

export const orderSettingsService = {
  async get() {
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create file with defaults if not exists
        await this.save(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      console.error('Failed to read order settings file:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      // Create config directory if not exists
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
      return settings;
    } catch (error) {
      console.error('Failed to save order settings file:', error);
      throw error;
    }
  },

  validate(settings) {
    const errors = [];

    // Auto Cancel Unconfirmed Orders
    if (typeof settings.autoCancelUnconfirmedMins !== 'number' || settings.autoCancelUnconfirmedMins < 1 || settings.autoCancelUnconfirmedMins > 1440) {
      errors.push('Auto Cancel Unconfirmed Orders must be between 1 and 1440 minutes.');
    }

    // Auto Complete Delivered Orders
    if (typeof settings.autoCompleteDeliveredDays !== 'number' || settings.autoCompleteDeliveredDays < 1 || settings.autoCompleteDeliveredDays > 90) {
      errors.push('Auto Complete Delivered Orders must be between 1 and 90 days.');
    }

    // Customer Cancellation Window
    if (settings.allowCustomerCancellation) {
      if (typeof settings.customerCancellationWindowMins !== 'number' || settings.customerCancellationWindowMins < 1 || settings.customerCancellationWindowMins > 1440) {
        errors.push('Customer Cancellation Window must be between 1 and 1440 minutes.');
      }
    }

    // Order Limits
    if (typeof settings.minOrderValue !== 'number' || settings.minOrderValue < 0) {
      errors.push('Minimum Order Value must be a non-negative number.');
    }
    if (typeof settings.maxOrderValue !== 'number' || settings.maxOrderValue < settings.minOrderValue) {
      errors.push('Maximum Order Value must be greater than or equal to Minimum Order Value.');
    }
    if (typeof settings.maxItemsPerOrder !== 'number' || settings.maxItemsPerOrder < 1) {
      errors.push('Maximum Items Per Order must be at least 1.');
    }
    if (typeof settings.maxQtyPerProduct !== 'number' || settings.maxQtyPerProduct < 1) {
      errors.push('Maximum Quantity Per Product must be at least 1.');
    }

    // Seller Acceptance Timeout
    if (typeof settings.autoExpireSellerAcceptanceMins !== 'number' || settings.autoExpireSellerAcceptanceMins < 1 || settings.autoExpireSellerAcceptanceMins > 1440) {
      errors.push('Auto Expire Seller Acceptance must be between 1 and 1440 minutes.');
    }
    if (!['CANCEL', 'ESCALATE'].includes(settings.sellerAcceptanceAction)) {
      errors.push('Seller Acceptance Action must be either CANCEL or ESCALATE.');
    }

    // Refund Window
    if (settings.allowRefundRequests) {
      if (typeof settings.refundRequestWindowDays !== 'number' || settings.refundRequestWindowDays < 1 || settings.refundRequestWindowDays > 90) {
        errors.push('Refund Request Window must be between 1 and 90 days.');
      }
    }

    // Status Transitions Validation
    if (settings.allowedTransitions) {
      // Prevent invalid transitions: DELIVERED -> PLACED
      if (settings.allowedTransitions.DELIVERED?.includes('PLACED')) {
        errors.push('Status transition DELIVERED -> PLACED is forbidden.');
      }
      // Prevent invalid transitions: CANCELLED -> PREPARING
      if (settings.allowedTransitions.CANCELLED?.includes('PREPARING')) {
        errors.push('Status transition CANCELLED -> PREPARING is forbidden.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
