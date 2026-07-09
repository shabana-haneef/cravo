import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../shared/services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '..', '..', '..', 'config', 'paymentSettings.json');

const DEFAULT_SETTINGS = {
  enableRazorpay: true,
  enableCod: false,
  maxCodAmount: 2000,
  minOrderAmount: 50,
  maxOrderAmount: 50000,
  maxSingleTransactionAmount: 50000,
  enableRefundRequests: true,
  refundRequestWindowDays: 7,
  requireAdminRefundApproval: true,
  autoRefundProcessing: false,
  commissionType: 'Percentage', // 'Percentage' or 'Fixed'
  commissionValue: 10,
  applyCommissionOn: 'Product Total', // 'Product Total' or 'Order Total'
  enableSellerPayouts: true,
  minPayoutThreshold: 500,
  payoutReleaseDelayDays: 7,
  autoPayoutProcessing: false,
  maxFailedPaymentAttempts: 5,
  manualReviewThreshold: 10000,
  blockExcessiveFailedAttempts: true
};

import { z } from 'zod';

const paymentSettingsSchema = z.object({
  enableRazorpay: z.boolean(),
  enableCod: z.boolean(),
  maxCodAmount: z.number().min(1, 'Maximum COD Order Amount must be between ₹1 and ₹50,000.').max(50000).optional(),
  minOrderAmount: z.number().min(0, 'Minimum Order Amount must be a non-negative number.'),
  maxOrderAmount: z.number().min(1, 'Maximum Order Amount must be a positive number.'),
  maxSingleTransactionAmount: z.number().min(1, 'Maximum Single Transaction Amount must be a positive number.'),
  enableRefundRequests: z.boolean(),
  refundRequestWindowDays: z.number().min(1, 'Refund Request Window must be between 1 and 30 days.').max(30),
  requireAdminRefundApproval: z.boolean(),
  autoRefundProcessing: z.boolean(),
  commissionType: z.enum(['Percentage', 'Fixed'], { errorMap: () => ({ message: "Commission Type must be 'Percentage' or 'Fixed'." }) }),
  commissionValue: z.number().min(0, 'Commission Value must be a non-negative number.'),
  applyCommissionOn: z.enum(['Product Total', 'Order Total'], { errorMap: () => ({ message: "Apply Commission On must be 'Product Total' or 'Order Total'." }) }),
  enableSellerPayouts: z.boolean(),
  minPayoutThreshold: z.number().min(0, 'Minimum Payout Threshold must be a non-negative number.'),
  payoutReleaseDelayDays: z.number().min(0, 'Payout Release Delay must be a non-negative number.'),
  autoPayoutProcessing: z.boolean(),
  maxFailedPaymentAttempts: z.number().min(1, 'Maximum Failed Payment Attempts must be a positive number.'),
  manualReviewThreshold: z.number().min(0, 'Manual Review Threshold must be a non-negative number.'),
  blockExcessiveFailedAttempts: z.boolean()
}).strict()
.refine(data => data.minOrderAmount <= data.maxOrderAmount, {
  message: "Minimum Order Amount cannot exceed Maximum Order Amount."
})
.refine(data => {
  if (data.commissionType === 'Percentage' && data.commissionValue > 100) return false;
  return true;
}, { message: "Percentage Commission cannot exceed 100%." });

export const paymentSettingsService = {
  async get() {
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      logger.error({ err: error }, 'Failed to read payment settings file');
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      const parsed = paymentSettingsSchema.parse(settings);
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      return parsed;
    } catch (error) {
      logger.error({ err: error }, 'Failed to save payment settings file');
      throw error;
    }
  },

  validate(settings) {
    const parsed = paymentSettingsSchema.safeParse(settings);
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
