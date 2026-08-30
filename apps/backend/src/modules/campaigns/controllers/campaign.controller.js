import { campaignService } from '../services/campaign.service.js';
import { 
  productPromotionSchema, 
  storewideOfferSchema, 
  discountCampaignSchema, 
  flashSaleSchema,
  verifyPaymentSchema 
} from '../validators/campaign.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { z } from 'zod';

export const campaignController = {
  async createProductPromotion(req, res, next) {
    try {
      const parsed = productPromotionSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors?.[0]?.message || 'Validation error', 400);

      const result = await campaignService.createProductPromotion(req.user.id, parsed.data, req.file);
      return successResponse(res, 'Product Promotion drafted and order created', result, 201);
    } catch (error) { next(error); }
  },

  async createStorewideOffer(req, res, next) {
    try {
      const parsed = storewideOfferSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors?.[0]?.message || 'Validation error', 400);

      const result = await campaignService.createStorewideOffer(req.user.id, parsed.data, req.file);
      return successResponse(res, 'Storewide Offer drafted and order created', result, 201);
    } catch (error) { next(error); }
  },

  async createDiscountCampaign(req, res, next) {
    try {
      const parsed = discountCampaignSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors?.[0]?.message || 'Validation error', 400);

      const result = await campaignService.createDiscountCampaign(req.user.id, parsed.data, req.file);
      return successResponse(res, 'Discount Campaign drafted and order created', result, 201);
    } catch (error) { next(error); }
  },

  async createFlashSale(req, res, next) {
    try {
      const parsed = flashSaleSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors?.[0]?.message || 'Validation error', 400);

      const result = await campaignService.createFlashSale(req.user.id, parsed.data, req.file);
      return successResponse(res, 'Flash Sale drafted and order created', result, 201);
    } catch (error) { next(error); }
  },

  async verifyPayment(req, res, next) {
    try {
      const parsed = verifyPaymentSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const updatedCampaign = await campaignService.verifyPayment(req.user.id, req.params.id, parsed.data);
      return successResponse(res, 'Payment verified successfully. Campaign is now ACTIVE.', updatedCampaign);
    } catch (error) { next(error); }
  },

  async getMyCampaigns(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await campaignService.getMyCampaigns(req.user.id, page, limit);
      return successResponse(res, 'Campaigns retrieved', { campaigns: result.data, meta: result.meta });
    } catch (error) { next(error); }
  },

  async pauseCampaign(req, res, next) {
    try {
      const campaign = await campaignService.pauseCampaign(req.user.id, req.params.id);
      return successResponse(res, 'Campaign paused', campaign);
    } catch (error) { next(error); }
  },

  async resumeCampaign(req, res, next) {
    try {
      const campaign = await campaignService.resumeCampaign(req.user.id, req.params.id);
      return successResponse(res, 'Campaign resumed', campaign);
    } catch (error) { next(error); }
  },

  // Admin Routes
  async getPendingCampaigns(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await campaignService.getPendingCampaigns(page, limit);
      return successResponse(res, 'Pending campaigns retrieved', { campaigns: result.data, meta: result.meta });
    } catch (error) { next(error); }
  },

  async approveCampaign(req, res, next) {
    try {
      const campaign = await campaignService.approveCampaign(req.user.id, req.params.id);
      return successResponse(res, 'Campaign approved', campaign);
    } catch (error) { next(error); }
  },

  async rejectCampaign(req, res, next) {
    try {
      const rejectCampaignSchema = z.object({
        reason: z.string().min(1, "Rejection reason is required").max(1000, "Rejection reason is too long")
      });
      const parsed = rejectCampaignSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { reason } = parsed.data;
      const campaign = await campaignService.rejectCampaign(req.user.id, req.params.id, reason);
      return successResponse(res, 'Campaign rejected', campaign);
    } catch (error) { next(error); }
  },

  async trackAnalytics(req, res, next) {
    try {
      const { type } = req.body; // 'impression' or 'click'
      const campaignId = req.params.id;
      
      const impressions = type === 'impression' ? 1 : 0;
      const clicks = type === 'click' ? 1 : 0;
      
      // We can directly call the repository to avoid circular/heavy service logic for high-freq endpoint
      const { campaignRepository } = await import('../repositories/campaign.repository.js');
      await campaignRepository.updateAnalytics(campaignId, impressions, clicks);
      
      return successResponse(res, 'Analytics tracked');
    } catch (error) { next(error); } // fire and forget errors mostly
  }
};
