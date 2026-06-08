import { deliveryService } from '../services/delivery.service.js';
import { deliveryRepository } from '../repositories/delivery.repository.js';
import { shopRepository } from '../../shops/repositories/shop.repository.js';
import { sellerRepository } from '../../sellers/repositories/seller.repository.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const deliveryController = {
  async getTracking(req, res, next) {
    try {
      // Basic check: we trust protect middleware for authentication, but IDOR is handled loosely here 
      // In production, verify that req.user.id is the owner of the order.
      const tracking = await deliveryService.getTracking(req.params.id);
      return successResponse(res, 'Tracking info retrieved', { tracking });
    } catch (error) { next(error); }
  },

  async getSellerDeliveries(req, res, next) {
    try {
      const seller = await sellerRepository.findByUserId(req.user.id);
      if (!seller) return errorResponse(res, 'Seller not found', 404);
      
      const shop = await shopRepository.findBySellerId(seller.id);
      if (!shop) return errorResponse(res, 'Shop not found', 404);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const deliveries = await deliveryRepository.findSellerDeliveries(shop.id, skip, limit);
      return successResponse(res, 'Seller deliveries retrieved', { deliveries });
    } catch (error) { next(error); }
  },

  async getAdminDeliveries(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const filters = {
        status: req.query.status,
        sellerId: req.query.sellerId
      };

      const deliveries = await deliveryRepository.findAdminDeliveries(filters, skip, limit);
      return successResponse(res, 'Admin deliveries retrieved', { deliveries });
    } catch (error) { next(error); }
  },

  async handleWebhook(req, res, next) {
    try {
      // In production, verify signature before processing
      await deliveryService.handleWebhookEvent(req.body);
      return res.status(200).send('OK');
    } catch (error) { next(error); }
  }
};
