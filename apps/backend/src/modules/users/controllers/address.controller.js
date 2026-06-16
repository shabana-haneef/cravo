import { addressService } from '../services/address.service.js';
import { addressSchema } from '../validators/address.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';

export const addressController = {
  async createAddress(req, res, next) {
    try {
      const parsed = addressSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors?.[0]?.message || 'Validation failed', 400);
      }

      const address = await addressService.createAddress(req.user.id, parsed.data);
      logger.info({ userId: req.user.id, addressId: address.id }, 'Address created');
      
      return successResponse(res, 'Address created successfully', { address }, 201);
    } catch (error) {
      next(error);
    }
  },

  async getAddresses(req, res, next) {
    try {
      const addresses = await addressService.getAddresses(req.user.id);
      return successResponse(res, 'Addresses retrieved successfully', { addresses });
    } catch (error) {
      next(error);
    }
  },

  async getAddress(req, res, next) {
    try {
      const address = await addressService.getAddressById(req.user.id, req.params.id);
      return successResponse(res, 'Address retrieved successfully', { address });
    } catch (error) {
      next(error);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const parsed = addressSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors?.[0]?.message || 'Validation failed', 400);
      }

      const address = await addressService.updateAddress(req.user.id, req.params.id, parsed.data);
      logger.info({ userId: req.user.id, addressId: address.id }, 'Address updated');
      
      return successResponse(res, 'Address updated successfully', { address });
    } catch (error) {
      next(error);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      await addressService.deleteAddress(req.user.id, req.params.id);
      logger.info({ userId: req.user.id, addressId: req.params.id }, 'Address deleted');
      
      return successResponse(res, 'Address deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};
