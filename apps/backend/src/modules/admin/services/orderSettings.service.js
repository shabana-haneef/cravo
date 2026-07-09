import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../shared/services/logger.js';

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

import { z } from 'zod';

const orderSettingsSchema = z.object({
  autoCancelUnconfirmedMins: z.number().min(1, 'Auto Cancel Unconfirmed Orders must be between 1 and 1440 minutes.').max(1440),
  autoCompleteDeliveredDays: z.number().min(1, 'Auto Complete Delivered Orders must be between 1 and 90 days.').max(90),
  allowCustomerCancellation: z.boolean(),
  customerCancellationWindowMins: z.number().min(1, 'Customer Cancellation Window must be between 1 and 1440 minutes.').max(1440).optional(),
  allowedTransitions: z.record(z.array(z.string())),
  minOrderValue: z.number().min(0, 'Minimum Order Value must be a non-negative number.'),
  maxOrderValue: z.number().min(0),
  maxItemsPerOrder: z.number().min(1, 'Maximum Items Per Order must be at least 1.'),
  maxQtyPerProduct: z.number().min(1, 'Maximum Quantity Per Product must be at least 1.'),
  requireVerifiedEmail: z.boolean(),
  requireActiveAddress: z.boolean(),
  blockSuspendedUsers: z.boolean(),
  allowGuestOrders: z.boolean(),
  autoExpireSellerAcceptanceMins: z.number().min(1, 'Auto Expire Seller Acceptance must be between 1 and 1440 minutes.').max(1440),
  sellerAcceptanceAction: z.enum(['CANCEL', 'ESCALATE']),
  allowRefundRequests: z.boolean(),
  refundRequestWindowDays: z.number().min(1, 'Refund Request Window must be between 1 and 90 days.').max(90).optional(),
  requireAdminRefundApproval: z.boolean()
}).strict()
.refine(data => data.maxOrderValue >= data.minOrderValue, {
  message: "Maximum Order Value must be greater than or equal to Minimum Order Value."
})
.refine(data => {
  if (data.allowedTransitions?.DELIVERED?.includes('PLACED')) return false;
  return true;
}, { message: "Status transition DELIVERED -> PLACED is forbidden." })
.refine(data => {
  if (data.allowedTransitions?.CANCELLED?.includes('PREPARING')) return false;
  return true;
}, { message: "Status transition CANCELLED -> PREPARING is forbidden." });

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
      logger.error({ err: error }, 'Failed to read order settings file');
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      // Clean arbitrary properties that might have bypassed Zod (though .strict() prevents it, we parse before saving)
      const parsed = orderSettingsSchema.parse(settings);
      
      // Create config directory if not exists
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      return parsed;
    } catch (error) {
      logger.error({ err: error }, 'Failed to save order settings file');
      throw error;
    }
  },

  validate(settings) {
    const parsed = orderSettingsSchema.safeParse(settings);
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
