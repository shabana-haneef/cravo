import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
      console.error('Failed to read payment settings file:', error);
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
      console.error('Failed to save payment settings file:', error);
      throw error;
    }
  },

  validate(settings) {
    const errors = [];

    // Payment Methods
    if (typeof settings.enableRazorpay !== 'boolean') {
      errors.push("Field 'enableRazorpay' must be a boolean.");
    }
    if (typeof settings.enableCod !== 'boolean') {
      errors.push("Field 'enableCod' must be a boolean.");
    }
    if (settings.enableCod) {
      const maxCodAmount = Number(settings.maxCodAmount);
      if (isNaN(maxCodAmount) || maxCodAmount < 1 || maxCodAmount > 50000) {
        errors.push("Maximum COD Order Amount must be between ₹1 and ₹50,000.");
      }
    }

    // Limits
    const minOrderAmount = Number(settings.minOrderAmount);
    const maxOrderAmount = Number(settings.maxOrderAmount);
    const maxSingleTransactionAmount = Number(settings.maxSingleTransactionAmount);

    if (isNaN(minOrderAmount) || minOrderAmount < 0) {
      errors.push("Minimum Order Amount must be a non-negative number.");
    }
    if (isNaN(maxOrderAmount) || maxOrderAmount <= 0) {
      errors.push("Maximum Order Amount must be a positive number.");
    }
    if (minOrderAmount > maxOrderAmount) {
      errors.push("Minimum Order Amount cannot exceed Maximum Order Amount.");
    }
    if (isNaN(maxSingleTransactionAmount) || maxSingleTransactionAmount <= 0) {
      errors.push("Maximum Single Transaction Amount must be a positive number.");
    }

    // Refund
    if (typeof settings.enableRefundRequests !== 'boolean') {
      errors.push("Field 'enableRefundRequests' must be a boolean.");
    }
    const refundRequestWindowDays = Number(settings.refundRequestWindowDays);
    if (isNaN(refundRequestWindowDays) || refundRequestWindowDays < 1 || refundRequestWindowDays > 30) {
      errors.push("Refund Request Window must be between 1 and 30 days.");
    }
    if (typeof settings.requireAdminRefundApproval !== 'boolean') {
      errors.push("Field 'requireAdminRefundApproval' must be a boolean.");
    }
    if (typeof settings.autoRefundProcessing !== 'boolean') {
      errors.push("Field 'autoRefundProcessing' must be a boolean.");
    }

    // Commission
    if (settings.commissionType !== 'Percentage' && settings.commissionType !== 'Fixed') {
      errors.push("Commission Type must be 'Percentage' or 'Fixed'.");
    }
    const commissionValue = Number(settings.commissionValue);
    if (isNaN(commissionValue) || commissionValue < 0) {
      errors.push("Commission Value must be a non-negative number.");
    }
    if (settings.commissionType === 'Percentage' && commissionValue > 100) {
      errors.push("Percentage Commission cannot exceed 100%.");
    }
    if (settings.applyCommissionOn !== 'Product Total' && settings.applyCommissionOn !== 'Order Total') {
      errors.push("Apply Commission On must be 'Product Total' or 'Order Total'.");
    }

    // Payouts
    if (typeof settings.enableSellerPayouts !== 'boolean') {
      errors.push("Field 'enableSellerPayouts' must be a boolean.");
    }
    const minPayoutThreshold = Number(settings.minPayoutThreshold);
    if (isNaN(minPayoutThreshold) || minPayoutThreshold < 0) {
      errors.push("Minimum Payout Threshold must be a non-negative number.");
    }
    const payoutReleaseDelayDays = Number(settings.payoutReleaseDelayDays);
    if (isNaN(payoutReleaseDelayDays) || payoutReleaseDelayDays < 0) {
      errors.push("Payout Release Delay must be a non-negative number.");
    }
    if (typeof settings.autoPayoutProcessing !== 'boolean') {
      errors.push("Field 'autoPayoutProcessing' must be a boolean.");
    }

    // Fraud
    const maxFailedPaymentAttempts = Number(settings.maxFailedPaymentAttempts);
    if (isNaN(maxFailedPaymentAttempts) || maxFailedPaymentAttempts <= 0) {
      errors.push("Maximum Failed Payment Attempts must be a positive number.");
    }
    const manualReviewThreshold = Number(settings.manualReviewThreshold);
    if (isNaN(manualReviewThreshold) || manualReviewThreshold < 0) {
      errors.push("Manual Review Threshold must be a non-negative number.");
    }
    if (typeof settings.blockExcessiveFailedAttempts !== 'boolean') {
      errors.push("Field 'blockExcessiveFailedAttempts' must be a boolean.");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
