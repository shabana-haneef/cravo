import crypto from 'crypto';
import { logger } from '../../../shared/services/logger.js';
import { deliveryService } from '../services/delivery.service.js';
import { deliveryRepository } from '../repositories/delivery.repository.js';
import { shopRepository } from '../../shops/repositories/shop.repository.js';
import { sellerRepository } from '../../sellers/repositories/seller.repository.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const deliveryController = {
  async getTracking(req, res, next) {
    try {
      const forceRefresh = req.query.forceRefresh === 'true';
      const tracking = await deliveryService.getTracking(req.params.id, forceRefresh);
      return successResponse(res, 'Tracking info retrieved', { tracking });
    } catch (error) { next(error); }
  },

  async getPublicTracking(req, res, next) {
    try {
      const { identifier } = req.params;
      const tracking = await deliveryService.getPublicTracking(identifier);
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

  async retryShipment(req, res, next) {
    try {
      const result = await deliveryService.retryShipment(req.params.id, req.user.id);
      return successResponse(res, 'Shipment retried successfully', { delivery: result });
    } catch (error) { next(error); }
  },

  async retryPickup(req, res, next) {
    try {
      const result = await deliveryService.retryPickup(req.params.id, req.user.id);
      return successResponse(res, result.message, result.pickupData);
    } catch (error) { next(error); }
  },

  async retryLabel(req, res, next) {
    try {
      const result = await deliveryService.retryLabel(req.params.id, req.user.id);
      return successResponse(res, result.message, { shippingLabelUrl: result.shippingLabelUrl });
    } catch (error) { next(error); }
  },

  async updateShipment(req, res, next) {
    try {
      const result = await deliveryService.updateShipment(req.params.id, req.body, req.user);
      return successResponse(res, 'Shipment details updated successfully', result);
    } catch (error) { next(error); }
  },

  async cancelShipment(req, res, next) {
    try {
      const result = await deliveryService.cancelShipment(req.params.id, req.user, req.body);
      return successResponse(res, 'Shipment cancelled successfully', result);
    } catch (error) { next(error); }
  },

  async cancelPickup(req, res, next) {
    try {
      const result = await deliveryService.cancelPickup(req.params.id, req.user, req.body);
      return successResponse(res, 'Pickup cancelled successfully', result);
    } catch (error) { next(error); }
  },

  async reschedulePickup(req, res, next) {
    try {
      const result = await deliveryService.reschedulePickup(req.params.id, req.user, req.body);
      return successResponse(res, 'Pickup scheduled/rescheduled successfully', result);
    } catch (error) { next(error); }
  },

  async updateEwaybill(req, res, next) {
    try {
      const result = await deliveryService.updateEwaybill(req.params.id, req.body, req.user);
      return successResponse(res, result.message || 'E-Waybill updated successfully', result);
    } catch (error) { next(error); }
  },

  async handleWebhook(req, res, next) {
    try {
      const headerName = process.env.DELHIVERY_WEBHOOK_AUTH_HEADER || 'Authorization';
      const expectedSecret = process.env.DELHIVERY_WEBHOOK_AUTH_SECRET;

      if (process.env.NODE_ENV === 'production' && !expectedSecret) {
        logger.fatal('DELHIVERY_WEBHOOK_AUTH_SECRET is missing in production. Webhooks will fail closed.');
        return res.status(500).json({ success: false, error: 'Webhook configuration error' });
      }

      if (expectedSecret) {
        const receivedSecret = req.headers[headerName.toLowerCase()];
        if (!receivedSecret) {
          return res.status(401).json({ success: false, error: 'Unauthorized webhook - Missing secret' });
        }
        
        try {
          const expectedBuffer = Buffer.from(expectedSecret);
          const receivedBuffer = Buffer.from(receivedSecret);
          
          if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
             return res.status(401).json({ success: false, error: 'Unauthorized webhook - Invalid secret' });
          }
        } catch (err) {
          return res.status(401).json({ success: false, error: 'Unauthorized webhook - Invalid format' });
        }
      }

      await deliveryService.handleWebhookEvent(req.body);
      return res.status(200).send('OK');
    } catch (error) { next(error); }
  },

  async getShippingLabel(req, res, next) {
    try {
      const { id } = req.params;
      const { pdf_size } = req.query;
      
      const result = await deliveryService.getShippingLabel(id, req.user, pdf_size);
      return successResponse(res, 'Shipping label retrieved successfully', result);
    } catch (error) { next(error); }
  }
};
