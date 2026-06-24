import prisma from '../../../lib/prisma.js';
import { successResponse } from '../../../shared/responses/apiResponse.js';
import { auditLogService } from '../services/auditLog.service.js';

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

        const revenueChartData = [
          { name: 'Jan', revenue: 4000 },
          { name: 'Feb', revenue: 3000 },
          { name: 'Mar', revenue: 5000 },
          { name: 'Apr', revenue: 4500 },
          { name: 'May', revenue: 6000 },
          { name: 'Jun', revenue: 8500 }
        ];

      return successResponse(res, 'Dashboard stats retrieved', {
        stats: {
          totalUsers,
          activeSellers,
          totalRevenue,
          platformGrowth,
          pendingApprovals,
          recentSignups,
          revenueChartData
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getSettings(req, res, next) {
    try {
      const isSmtpConnected = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_dummy_key_for_dev';
      return successResponse(res, 'Settings retrieved', { 
        settings: {
          ...mockSettings,
          smtpConnected: !!isSmtpConnected
        } 
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const { platformName, supportEmail } = req.body;
      if (platformName) mockSettings.platformName = platformName;
      if (supportEmail) mockSettings.supportEmail = supportEmail;
      
      await auditLogService.log({
        adminId: req.user.id,
        adminEmail: req.user.email,
        action: 'SETTINGS_UPDATE',
        targetType: 'PLATFORM_SETTINGS',
        targetId: 'GLOBAL',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return successResponse(res, 'Settings updated successfully', { settings: mockSettings });
    } catch (error) {
      next(error);
    }
  }
};
