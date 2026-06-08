import { sellerService } from '../services/seller.service.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';
import { z } from 'zod';

const applySchema = z.object({
  bio: z.string().max(500).optional()
});

export const sellerController = {
  async apply(req, res, next) {
    try {
      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors[0].message, 400);
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return errorResponse(res, "Documents are required.", 400);
      }

      const application = await sellerService.applyAsSeller(req.user.id, parsed.data, req.files);
      logger.info({ userId: req.user.id, applicationId: application.id }, 'Seller application submitted');
      
      return successResponse(res, 'Application submitted successfully', { application }, 201);
    } catch (error) {
      next(error);
    }
  },

  async getApplication(req, res, next) {
    try {
      const application = await sellerService.getApplicationStatus(req.user.id);
      return successResponse(res, 'Application retrieved successfully', { application });
    } catch (error) {
      next(error);
    }
  }
};
