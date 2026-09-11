import { sellerService } from '../../sellers/services/seller.service.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';
import { auditLogService } from '../services/auditLog.service.js';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters")
});

export const adminSellerController = {
  async listApplications(req, res, next) {
    try {
      const { status } = req.query;
      const applications = await sellerService.listApplications(status);
      return successResponse(res, 'Applications retrieved successfully', { applications });
    } catch (error) {
      next(error);
    }
  },

  async getApplication(req, res, next) {
    try {
      const application = await sellerService.getApplicationById(req.params.id);
      return successResponse(res, 'Application retrieved successfully', { application });
    } catch (error) {
      next(error);
    }
  },

  async approveApplication(req, res, next) {
    try {
      const application = await sellerService.approveApplication(req.params.id);
      logger.info({ adminId: req.user.id, sellerId: application.id }, 'Seller application approved');
      
      await auditLogService.logFromRequest(req, {
        actionType: 'SELLER_APPROVAL',
        targetType: 'SELLER',
        targetId: application.id
      });

      return successResponse(res, 'Application approved successfully', { application });
    } catch (error) {
      next(error);
    }
  },

  async rejectApplication(req, res, next) {
    try {
      const parsed = rejectSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const application = await sellerService.rejectApplication(req.params.id, parsed.data.reason);
      logger.info({ adminId: req.user.id, sellerId: application.id }, 'Seller application rejected');
      
      await auditLogService.logFromRequest(req, {
        actionType: 'SELLER_REJECTION',
        targetType: 'SELLER',
        targetId: application.id
      });

      return successResponse(res, 'Application rejected successfully', { application });
    } catch (error) {
      next(error);
    }
  },

  async createWarehouse(req, res, next) {
    try {
      const seller = await sellerService.createDelhiveryWarehouse(req.params.id);
      logger.info({ adminId: req.user.id, sellerId: seller.id }, 'Delhivery Client Warehouse created for seller');
      
      await auditLogService.logFromRequest(req, {
        actionType: 'WAREHOUSE_CREATION',
        targetType: 'SELLER',
        targetId: seller.id
      });

      return successResponse(res, 'Warehouse created successfully', { seller });
    } catch (error) {
      next(error);
    }
  }
};
