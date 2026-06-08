import { productVariantService } from '../services/productVariant.service.js';
import { variantSchema, updateVariantSchema } from '../validators/productVariant.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const productVariantController = {
  async addVariant(req, res, next) {
    try {
      const parsed = variantSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const variant = await productVariantService.addVariant(req.user.id, req.params.productId, parsed.data);
      return successResponse(res, 'Variant added', { variant }, 201);
    } catch (error) { next(error); }
  },
  async updateVariant(req, res, next) {
    try {
      const parsed = updateVariantSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const variant = await productVariantService.updateVariant(req.user.id, req.params.productId, req.params.variantId, parsed.data);
      return successResponse(res, 'Variant updated', { variant });
    } catch (error) { next(error); }
  },
  async deleteVariant(req, res, next) {
    try {
      await productVariantService.deleteVariant(req.user.id, req.params.productId, req.params.variantId);
      return successResponse(res, 'Variant deleted');
    } catch (error) { next(error); }
  }
};
