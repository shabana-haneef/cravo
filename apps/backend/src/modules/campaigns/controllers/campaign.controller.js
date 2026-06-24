import { campaignService } from '../services/campaign.service.js';
import { campaignSchema } from '../validators/campaign.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const campaignController = {
  async createCampaign(req, res, next) {
    try {
      const parsed = campaignSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error?.errors?.[0]?.message || "Invalid campaign data", 400);

      const result = await campaignService.createCampaign(req.user.id, parsed.data, req.file);
      return successResponse(res, 'Campaign drafted and order created', result, 201);
    } catch (error) { next(error); }
  },

  async verifyPayment(req, res, next) {
    try {
      const updatedCampaign = await campaignService.verifyPayment(req.user.id, req.params.id, req.body);
      return successResponse(res, 'Payment verified successfully. Campaign is now pending approval.', updatedCampaign);
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
      const { reason } = req.body;
      if (!reason) return errorResponse(res, "Rejection reason is required", 400);
      const campaign = await campaignService.rejectCampaign(req.user.id, req.params.id, reason);
      return successResponse(res, 'Campaign rejected', campaign);
    } catch (error) { next(error); }
  }
};
