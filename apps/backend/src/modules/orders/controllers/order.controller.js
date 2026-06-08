import { checkoutService } from '../services/checkout.service.js';
import { orderService } from '../services/order.service.js';
import { checkoutSchema, updateOrderStatusSchema } from '../validators/order.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const orderController = {
  async getPreview(req, res, next) {
    try {
      const preview = await checkoutService.getPreview(req.user.id);
      return successResponse(res, 'Checkout preview retrieved', preview);
    } catch (error) { next(error); }
  },

  async checkout(req, res, next) {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const result = await checkoutService.processCheckout(req.user.id, parsed.data.addressId);
      return successResponse(res, 'Order created successfully', result, 201);
    } catch (error) { next(error); }
  },

  async getMyOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const orders = await orderService.getMyOrders(req.user.id, page);
      return successResponse(res, 'Orders retrieved', { orders });
    } catch (error) { next(error); }
  },

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.user.id, req.params.id);
      return successResponse(res, 'Order retrieved', { order });
    } catch (error) { next(error); }
  },

  async getSellerOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const orders = await orderService.getSellerOrders(req.user.id, page);
      return successResponse(res, 'Seller orders retrieved', { orders });
    } catch (error) { next(error); }
  },

  async cancelOrder(req, res, next) {
    try {
      const result = await orderService.cancelOrder(req.user.id, req.params.id);
      return successResponse(res, result.message, null);
    } catch (error) { next(error); }
  },

  async updateOrderStatus(req, res, next) {
    try {
      const parsed = updateOrderStatusSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const result = await orderService.updateOrderStatus(req.user.id, req.params.id, parsed.data.status);
      return successResponse(res, result.message, null);
    } catch (error) { next(error); }
  }
};
