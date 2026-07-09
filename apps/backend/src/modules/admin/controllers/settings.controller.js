import { successResponse } from '../../../shared/responses/apiResponse.js';
import { auditLogService } from '../services/auditLog.service.js';
import { orderSettingsService } from '../services/orderSettings.service.js';
import { deliverySettingsService } from '../services/deliverySettings.service.js';
import { governanceSettingsService } from '../services/governanceSettings.service.js';
import { paymentSettingsService } from '../services/paymentSettings.service.js';
import { inventorySettingsService } from '../services/inventorySettings.service.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const settingsController = {
  // Get Order Settings
  async getOrderSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await orderSettingsService.get();
      return successResponse(res, 'Order settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Order Settings
  async updateOrderSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify order settings.', 403));
      }

      const newSettings = req.body;
      const validation = orderSettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await orderSettingsService.get();
      const savedSettings = await orderSettingsService.save(newSettings);

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        const isChanged = typeof val === 'object' 
          ? JSON.stringify(val) !== JSON.stringify(oldVal)
          : val !== oldVal;
        
        if (isChanged) {
          await auditLogService.logFromRequest(req, {
            actionType: 'SETTINGS_UPDATE',
            targetType: 'ORDER_SETTINGS',
            targetId: key,
            targetName: `Update Order Setting: ${key}`
          });
        }
      }

      return successResponse(res, 'Order settings updated successfully', { settings: savedSettings });
    } catch (error) {
      next(error);
    }
  },

  // Get Delivery Settings
  async getDeliverySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await deliverySettingsService.get();
      return successResponse(res, 'Delivery settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Delivery Settings
  async updateDeliverySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify delivery settings.', 403));
      }

      const newSettings = req.body;
      const validation = deliverySettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await deliverySettingsService.get();
      const savedSettings = await deliverySettingsService.save(newSettings);

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        const isChanged = typeof val === 'object' 
          ? JSON.stringify(val) !== JSON.stringify(oldVal)
          : val !== oldVal;
        
        if (isChanged) {
          await auditLogService.logFromRequest(req, {
            actionType: 'SETTINGS_UPDATE',
            targetType: 'DELIVERY_SETTINGS',
            targetId: key,
            targetName: `Update Delivery Setting: ${key}`
          });
        }
      }

      return successResponse(res, 'Delivery settings updated successfully', { settings: savedSettings });
    } catch (error) {
      next(error);
    }
  },

  // Get Governance Settings
  async getGovernanceSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await governanceSettingsService.get();
      return successResponse(res, 'Governance settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Governance Settings
  async updateGovernanceSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify governance settings.', 403));
      }

      const newSettings = req.body;
      const validation = governanceSettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await governanceSettingsService.get();
      const savedSettings = await governanceSettingsService.save(newSettings);

      // Mapping settings key to descriptive names for logs
      const descriptiveNames = {
        requireSellerApproval: 'Seller Approval Requirement Changed',
        requireSellerDocumentVerification: 'Seller Document Verification Requirement Changed',
        allowSellerReapplication: 'Seller Reapplication Permission Changed',
        requireProductApproval: 'Product Approval Requirement Changed',
        reapproveAfterProductUpdate: 'Product Reapprove On Update Changed',
        allowProductDrafts: 'Product Draft Permission Changed',
        requireEmailVerification: 'Email Verification Requirement Changed',
        blockSuspendedUsers: 'Block Suspended Users Configuration Changed',
        allowNewCustomerRegistrations: 'New Registrations Configuration Changed',
        allowNewSellerApplications: 'Seller Applications Configuration Changed',
        allowNewProductSubmissions: 'New Product Submissions Configuration Changed'
      };

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        if (val !== oldVal) {
          await auditLogService.logFromRequest(req, {
            actionType: 'SETTINGS_UPDATE',
            targetType: 'GOVERNANCE_SETTINGS',
            targetId: key,
            targetName: descriptiveNames[key] || `Update Governance Setting: ${key}`
          });
        }
      }

      return successResponse(res, 'Governance settings updated successfully', { settings: savedSettings });
    } catch (error) {
      next(error);
    }
  },

  // Get Payment Settings
  async getPaymentSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await paymentSettingsService.get();
      return successResponse(res, 'Payment settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Payment Settings
  async updatePaymentSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify payment settings.', 403));
      }

      const newSettings = req.body;
      const validation = paymentSettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await paymentSettingsService.get();
      const savedSettings = await paymentSettingsService.save(newSettings);

      // Mapping settings key to descriptive names for logs
      const descriptiveNames = {
        enableRazorpay: 'Razorpay Enabled status changed',
        enableCod: 'Cash on Delivery Enabled status changed',
        maxCodAmount: 'Maximum COD Order Amount changed',
        minOrderAmount: 'Minimum Order Amount limit changed',
        maxOrderAmount: 'Maximum Order Amount limit changed',
        maxSingleTransactionAmount: 'Maximum Single Transaction limit changed',
        enableRefundRequests: 'Refund requests allowed status changed',
        refundRequestWindowDays: 'Refund request window changed',
        requireAdminRefundApproval: 'Admin Refund Approval status changed',
        autoRefundProcessing: 'Auto Refund Processing status changed',
        commissionType: 'Commission Type changed',
        commissionValue: 'Commission Value changed',
        applyCommissionOn: 'Apply Commission Target changed',
        enableSellerPayouts: 'Seller Payouts allowed status changed',
        minPayoutThreshold: 'Minimum Payout Threshold changed',
        payoutReleaseDelayDays: 'Payout Release Delay changed',
        autoPayoutProcessing: 'Automatic Payout Processing changed',
        maxFailedPaymentAttempts: 'Maximum Failed Payment Attempts changed',
        manualReviewThreshold: 'Manual Review Threshold changed',
        blockExcessiveFailedAttempts: 'Block Excessive Failed Attempts status changed'
      };

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        if (val !== oldVal) {
          await auditLogService.logFromRequest(req, {
            actionType: 'SETTINGS_UPDATE',
            targetType: 'PAYMENT_SETTINGS',
            targetId: key,
            targetName: descriptiveNames[key] || `Update Payment Setting: ${key}`
            // Note: details dropped, as logFromRequest doesn't natively map details currently, or we can add it to logFromRequest if needed, but standard schema doesn't have 'details' anyway. Let's look at schema later or just pass it to `this.log`. `auditLogService.log` doesn't have `details` argument. Wait, wait, I can just pass it directly if needed, but `auditLogService.log` signature:
          });
        }
      }

      return successResponse(res, 'Payment settings updated successfully', { settings: savedSettings });
    } catch (error) {
      next(error);
    }
  },

  // Get Inventory Settings
  async getInventorySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await inventorySettingsService.get();
      return successResponse(res, 'Inventory settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Inventory Settings
  async updateInventorySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify inventory settings.', 403));
      }

      const newSettings = req.body;
      const validation = inventorySettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await inventorySettingsService.get();
      const savedSettings = await inventorySettingsService.save(newSettings);

      // Mapping settings key to descriptive names for logs
      const descriptiveNames = {
        enableLowStockAlerts: 'Low stock alerts status changed',
        defaultLowStockThreshold: 'Default low stock threshold changed',
        criticalStockThreshold: 'Critical stock threshold changed',
        enableStockReservation: 'Stock reservation status changed',
        reservationExpiryTime: 'Reservation expiry time changed',
        autoReleaseExpiredReservations: 'Auto release expired reservations status changed',
        allowPurchaseWhenOutOfStock: 'Allow purchase when out of stock status changed',
        showOutOfStockProducts: 'Show out of stock products status changed',
        hideProductsAfterStockReachesZero: 'Hide products after stock reaches zero status changed',
        allowSellerInventoryUpdates: 'Allow seller inventory updates status changed',
        requireInventoryChangeLogging: 'Require inventory change logging status changed',
        requireReasonForManualAdjustment: 'Require reason for manual adjustment status changed',
        trackVariantInventorySeparately: 'Track variant inventory separately status changed',
        preventOversellingVariants: 'Prevent overselling variants status changed',
        requireVariantStockBeforeListing: 'Require variant stock before listing status changed',
        enableLowStockNotifications: 'Enable low stock notifications status changed',
        enableCriticalStockNotifications: 'Enable critical stock notifications status changed',
        notificationFrequency: 'Notification frequency changed',
        enableInventoryLogs: 'Enable inventory logs status changed',
        logRetentionPeriod: 'Log retention period changed',
        validateStockBeforePaymentVerification: 'Validate stock before payment verification status changed'
      };

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        if (val !== oldVal) {
          await auditLogService.logFromRequest(req, {
            actionType: 'SETTINGS_UPDATE',
            targetType: 'INVENTORY_SETTINGS',
            targetId: key,
            targetName: descriptiveNames[key] || `Update Inventory Setting: ${key}`
          });
        }
      }

      return successResponse(res, 'Inventory settings updated successfully', { settings: savedSettings });
    } catch (error) {
      next(error);
    }
  }
};
