import { shopService } from '../services/shop.service.js';
import { createShopSchema, updateShopSchema, updateTimingsSchema } from '../validators/shop.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';

export const shopController = {
  async createShop(req, res, next) {
    try {
      const parsed = createShopSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const shop = await shopService.createShop(req.user.id, parsed.data, req.files || {});
      logger.info({ userId: req.user.id, shopId: shop.id }, 'Shop created');
      
      return successResponse(res, 'Shop created successfully', { shop }, 201);
    } catch (error) {
      next(error);
    }
  },

  async getMyShop(req, res, next) {
    try {
      const shop = await shopService.getMyShop(req.user.id);
      return successResponse(res, 'Shop retrieved successfully', { shop });
    } catch (error) {
      next(error);
    }
  },

  async updateShop(req, res, next) {
    try {
      const parsed = updateShopSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const shop = await shopService.updateShop(req.user.id, parsed.data, req.files || {});
      logger.info({ userId: req.user.id, shopId: shop.id }, 'Shop updated');
      
      return successResponse(res, 'Shop updated successfully', { shop });
    } catch (error) {
      next(error);
    }
  },

  async updateTimings(req, res, next) {
    try {
      const parsed = updateTimingsSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      await shopService.updateTimings(req.user.id, parsed.data.timings);
      logger.info({ userId: req.user.id }, 'Shop timings updated');
      
      return successResponse(res, 'Shop timings updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getPublicShop(req, res, next) {
    try {
      const shop = await shopService.getPublicShop(req.params.slug);
      return successResponse(res, 'Shop retrieved successfully', { shop });
    } catch (error) {
      next(error);
    }
  }
};
