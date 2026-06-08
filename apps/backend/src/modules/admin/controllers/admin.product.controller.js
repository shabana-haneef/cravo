import { productService } from '../../products/services/product.service.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';
import { z } from 'zod';

export const adminProductController = {
  async getPending(req, res, next) {
    try {
      const products = await productService.getPendingApplications();
      return successResponse(res, 'Pending products retrieved', { products });
    } catch (error) { next(error); }
  },

  async approve(req, res, next) {
    try {
      const product = await productService.approveProduct(req.params.id);
      logger.info({ adminId: req.user.id, productId: product.id }, 'Product approved');
      return successResponse(res, 'Product approved', { product });
    } catch (error) { next(error); }
  },

  async reject(req, res, next) {
    try {
      const schema = z.object({ reason: z.string().min(5) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const product = await productService.rejectProduct(req.params.id, parsed.data.reason);
      logger.info({ adminId: req.user.id, productId: product.id }, 'Product rejected');
      return successResponse(res, 'Product rejected', { product });
    } catch (error) { next(error); }
  }
};
