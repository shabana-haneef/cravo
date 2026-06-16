import { cartService } from '../services/cart.service.js';
import { addItemSchema, updateItemSchema } from '../validators/cart.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const cartController = {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user.id);
      return successResponse(res, 'Cart retrieved', { cart });
    } catch (error) { next(error); }
  },

  async addItem(req, res, next) {
    try {
      const parsed = addItemSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const cart = await cartService.addItem(req.user.id, parsed.data.productVariantId, parsed.data.quantity);
      return successResponse(res, 'Item added to cart', { cart });
    } catch (error) { next(error); }
  },

  async updateItemQuantity(req, res, next) {
    try {
      const parsed = updateItemSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const cart = await cartService.updateItemQuantity(req.user.id, req.params.itemId, parsed.data.quantity);
      return successResponse(res, 'Cart updated', { cart });
    } catch (error) { next(error); }
  },

  async removeItem(req, res, next) {
    try {
      const cart = await cartService.removeItem(req.user.id, req.params.itemId);
      return successResponse(res, 'Item removed from cart', { cart });
    } catch (error) { next(error); }
  },

  async clearCart(req, res, next) {
    try {
      const cart = await cartService.clearCart(req.user.id);
      return successResponse(res, 'Cart cleared', { cart });
    } catch (error) { next(error); }
  }
};
