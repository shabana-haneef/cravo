import prisma from '../../../lib/prisma.js';
import { successResponse } from '../../../shared/responses/apiResponse.js';

// In-memory settings for demo purposes (since no Settings table exists in Prisma)
let mockSettings = {
  platformName: 'Cravo',
  supportEmail: 'support@cravo.com'
};

export const adminDashboardController = {
  async getStats(req, res, next) {
    try {
      // Get counts concurrently
      const [
        totalUsers,
        activeSellers,
        revenueAgg,
        pendingApprovals,
        recentSignups
      ] = await Promise.all([
        prisma.user.count(),
        prisma.seller.count({ where: { status: 'APPROVED' } }),
        prisma.order.aggregate({
          _sum: { grandTotal: true },
          where: { status: { in: ['DELIVERED'] } }
        }),
        prisma.seller.findMany({
          where: { status: 'PENDING' },
          include: { user: { select: { email: true, profile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, createdAt: true, profile: true },
          take: 5
        })
      ]);

      const totalRevenue = revenueAgg._sum.grandTotal || 0;
      
      // Calculate a dummy growth percentage based on users (just for UI flavor)
      const platformGrowth = totalUsers > 0 ? Math.min(100, totalUsers * 5) : 0;

      return successResponse(res, 'Dashboard stats retrieved', {
        stats: {
          totalUsers,
          activeSellers,
          totalRevenue,
          platformGrowth,
          pendingApprovals,
          recentSignups
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getSettings(req, res, next) {
    try {
      return successResponse(res, 'Settings retrieved', { settings: mockSettings });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const { platformName, supportEmail } = req.body;
      if (platformName) mockSettings.platformName = platformName;
      if (supportEmail) mockSettings.supportEmail = supportEmail;
      
      return successResponse(res, 'Settings updated successfully', { settings: mockSettings });
    } catch (error) {
      next(error);
    }
  }
};
