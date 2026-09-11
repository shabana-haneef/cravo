import { sellerService } from '../services/seller.service.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';
import { z } from 'zod';

const applySchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  mobileNumber: z.string().min(10, 'Valid Mobile Number is required'),
  
  businessName: z.string().min(1, 'Business Name is required'),
  businessType: z.string().min(1, 'Business Type is required'),
  fssaiNumber: z.string().min(14, 'FSSAI Number must be exactly 14 digits').max(14, 'FSSAI Number must be exactly 14 digits'),
  
  businessAddressLine1: z.string().min(1, 'Address Line 1 is required'),
  businessAddressLine2: z.string().optional(),
  businessCity: z.string().min(1, 'City is required'),
  businessState: z.string().min(1, 'State is required'),
  businessPincode: z.string().min(5, 'Postal Code is required'),
  businessCountry: z.string().optional().default('India'),
  
  pickupLocationName: z.string().optional(),
  pickupAddress: z.string().min(1, 'Pickup Address is required'),
  pickupCity: z.string().min(1, 'Pickup City is required'),
  pickupState: z.string().min(1, 'Pickup State is required'),
  pickupPincode: z.string().min(5, 'Pickup Postal Code is required'),
  pickupCountry: z.string().optional().default('India'),
  
  returnAddressSameAsPickup: z.union([z.boolean(), z.string()]).transform(v => v === 'true' || v === true).default(true),
  returnAddress: z.string().optional(),
  returnCity: z.string().optional(),
  returnState: z.string().optional(),
  returnPincode: z.string().optional(),
  returnCountry: z.string().optional().default('India'),
  
  accountHolderName: z.string().min(1, 'Account Holder Name is required'),
  bankName: z.string().min(1, 'Bank Name is required'),
  accountNumber: z.string().min(1, 'Account Number is required'),
  ifsc: z.string().min(1, 'IFSC Code is required'),
  branchName: z.string().min(1, 'Branch Name is required'),
  
  storeName: z.string().min(1, 'Store Name is required'),
  storeDescription: z.string().optional(),
  storeWebsite: z.string().optional(),
  
  supportEmail: z.string().optional().or(z.literal('')),
  supportPhone: z.string().optional()
});

export const sellerController = {
  async apply(req, res, next) {
    try {
      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors[0].message, 400);
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return errorResponse(res, "Documents are required.", 400);
      }

      const application = await sellerService.applyAsSeller(req.user.id, parsed.data, req.files);
      logger.info({ userId: req.user.id, applicationId: application.id }, 'Seller application submitted');
      
      return successResponse(res, 'Application submitted successfully', { application }, 201);
    } catch (error) {
      next(error);
    }
  },

  async getApplication(req, res, next) {
    try {
      const application = await sellerService.getApplicationStatus(req.user.id);
      return successResponse(res, 'Application retrieved successfully', { application });
    } catch (error) {
      next(error);
    }
  },

  async getPayoutSettings(req, res, next) {
    try {
      const payoutSettings = await sellerService.getPayoutSettings(req.user.id);
      return successResponse(res, 'Payout settings retrieved successfully', payoutSettings);
    } catch (error) {
      next(error);
    }
  },

  async requestPayoutUpdateOtp(req, res, next) {
    try {
      const result = await sellerService.requestPayoutUpdateOtp(req.user.id);
      return successResponse(res, result.message, null);
    } catch (error) {
      next(error);
    }
  },

  async updatePayoutSettings(req, res, next) {
    try {
      const { otp, bankData } = req.body;
      if (!otp || !bankData) {
        return errorResponse(res, 'OTP and bank details are required', 400);
      }
      const updated = await sellerService.verifyAndUpdatePayoutSettings(req.user.id, otp, bankData);
      return successResponse(res, 'Bank account updated successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  async getNotificationPreferences(req, res, next) {
    try {
      const preferences = await sellerService.getNotificationPreferences(req.user.id);
      return successResponse(res, 'Notification preferences retrieved', preferences);
    } catch (error) {
      next(error);
    }
  },

  async updateNotificationPreferences(req, res, next) {
    try {
      const updated = await sellerService.updateNotificationPreferences(req.user.id, req.body);
      return successResponse(res, 'Notification preferences updated successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  async getStoreProfile(req, res, next) {
    try {
      const profile = await sellerService.getStoreProfile(req.user.id);
      return successResponse(res, 'Store profile retrieved', profile);
    } catch (error) {
      next(error);
    }
  },

  async updateStoreProfile(req, res, next) {
    try {
      const updated = await sellerService.updateStoreProfile(req.user.id, req.body);
      return successResponse(res, 'Store profile updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }
};
