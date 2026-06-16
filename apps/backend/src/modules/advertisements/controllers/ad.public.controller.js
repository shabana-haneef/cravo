import prisma from '../../../lib/prisma.js';
import { successResponse } from '../../../shared/responses/apiResponse.js';

export const adPublicController = {
  /**
   * Get all active advertisements to show on the public site
   */
  async getActiveAds(req, res, next) {
    try {
      const now = new Date();
      const ads = await prisma.advertisement.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Track impressions/views could be done here or in another endpoint
      // We will increment views for all returned ads (simplified logic)
      if (ads.length > 0) {
        await prisma.advertisement.updateMany({
          where: { id: { in: ads.map(a => a.id) } },
          data: { views: { increment: 1 } }
        });
      }

      return successResponse(res, 'Active ads retrieved', ads);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Track ad click
   */
  async clickAd(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.advertisement.update({
        where: { id },
        data: { clicks: { increment: 1 } }
      });
      return successResponse(res, 'Ad clicked');
    } catch (error) {
      next(error);
    }
  }
};
