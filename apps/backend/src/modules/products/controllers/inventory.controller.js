import { inventoryService } from '../services/inventory.service.js';
import { adjustStockSchema } from '../validators/inventory.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const inventoryController = {
  async getInventory(req, res, next) {
    try {
      const inventory = await inventoryService.getInventory(req.user.id, req.params.variantId);
      return successResponse(res, 'Inventory retrieved', { inventory });
    } catch (error) { next(error); }
  },

  async adjustStock(req, res, next) {
    try {
      const parsed = adjustStockSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const inventory = await inventoryService.adjustStock(
        req.user.id, 
        req.params.variantId, 
        parsed.data.quantity, 
        parsed.data.reason
      );
      
      return successResponse(res, 'Stock adjusted', { inventory });
    } catch (error) { next(error); }
  },

  async getHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const history = await inventoryService.getHistory(req.user.id, req.params.variantId, page, limit);
      return successResponse(res, 'Inventory history retrieved', { history });
    } catch (error) { next(error); }
  }
};
