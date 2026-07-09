import { successResponse } from '../../../shared/responses/apiResponse.js';
import { auditLogService } from '../services/auditLog.service.js';
import { integrationsService } from '../services/integrations.service.js';
import { inventorySettingsService } from '../services/inventorySettings.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import axios from 'axios';
import prisma from '../../../lib/prisma.js';
import { z } from 'zod';

export const healthController = {
  // System Health Check (Diagnostics Report)
  async getHealth(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const diagnostics = await integrationsService.getHealthReport();

      // Log execution
      await auditLogService.logFromRequest(req, {
        actionType: 'HEALTH_CHECK_RUN',
        targetType: 'DIAGNOSTICS',
        targetId: 'SYSTEM'
      });

      return successResponse(res, 'Health check completed', { diagnostics });
    } catch (error) {
      next(error);
    }
  },

  // Test Individual Connection
  async testConnection(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const { service } = req.params;
      let result = null;

      if (service === 'razorpay') {
        result = await integrationsService.testRazorpay();
      } else if (service === 'delhivery') {
        result = await integrationsService.testDelhivery();
      } else if (service === 'smtp') {
        // Only SUPER_ADMIN (shabanahaneef10@gmail.com) can trigger test emails
        if (admin.email !== 'shabanahaneef10@gmail.com') {
          return next(new AppError('Only the Super Admin can trigger SMTP email tests', 403));
        }
        const testEmailSchema = z.object({
          targetEmail: z.string().email('Invalid target email format').optional()
        });
        const parsed = testEmailSchema.safeParse(req.body || {});
        if (!parsed.success) {
          return next(new AppError(parsed.error.errors[0].message, 400));
        }
        const targetEmail = parsed.data.targetEmail || admin.email;
        result = await integrationsService.sendTestEmail(admin.email, targetEmail);
      } else if (service === 'cloudinary') {
        result = await integrationsService.testCloudinaryUpload();
      } else {
        return next(new AppError('Invalid service test requested', 400));
      }

      // Log action Type
      await auditLogService.logFromRequest(req, {
        actionType: 'INTEGRATION_CREDENTIALS_UPDATE', // System operations category
        targetType: 'INTEGRATION_CONNECTION',
        targetId: service.toUpperCase(),
        targetName: `Test Connection: ${service}`
      });

      return successResponse(res, `Connection test completed for ${service}`, result);
    } catch (error) {
      next(error);
    }
  },

  // Get Integrations Events Log Stream
  async getIntegrationLogs(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }
      const { service } = req.query;
      const logs = await integrationsService.getEvents(service);
      return successResponse(res, 'Integration events logs retrieved', { logs });
    } catch (error) {
      next(error);
    }
  },

  // Get Delivery Analytics
  async getDeliveryAnalytics(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const totalDeliveries = await prisma.delivery.count();
      const successfulDeliveries = await prisma.delivery.count({ where: { status: 'DELIVERED' } });
      const failedDeliveries = await prisma.delivery.count({ where: { status: 'FAILED' } });
      const activeShipments = await prisma.delivery.count({
        where: {
          status: {
            in: ['PENDING', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
          }
        }
      });

      const deliveredDeliveries = await prisma.delivery.findMany({
        where: { status: 'DELIVERED' },
        select: { createdAt: true, updatedAt: true, estimatedDeliveryDate: true },
        orderBy: { createdAt: 'desc' },
        take: 100 // Cap to last 100 for average time calculation to prevent memory exhaustion
      });

      let totalHours = 0;
      let lateCount = 0;
      deliveredDeliveries.forEach(d => {
        const durationMs = new Date(d.updatedAt) - new Date(d.createdAt);
        totalHours += durationMs / (1000 * 60 * 60);
        if (d.estimatedDeliveryDate && new Date(d.updatedAt) > new Date(d.estimatedDeliveryDate)) {
          lateCount++;
        }
      });

      const averageDeliveryTime = deliveredDeliveries.length > 0 ? (totalHours / deliveredDeliveries.length).toFixed(1) + ' Hours' : '0 Hours';
      const delhiverySuccessRate = totalDeliveries > 0 ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(1) + '%' : '100%';

      return successResponse(res, 'Delivery analytics retrieved successfully', {
        analytics: {
          totalDeliveries,
          successfulDeliveries,
          failedDeliveries,
          averageDeliveryTime,
          lateDeliveries: lateCount,
          activeShipments,
          delhiverySuccessRate
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get Delhivery Integration Info
  async getDelhiveryIntegrationInfo(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const check = await integrationsService.checkDelhivery();
      
      const lastShipment = await prisma.delivery.findFirst({
        where: { courierPartner: 'DELHIVERY', NOT: { status: 'FAILED' } },
        orderBy: { createdAt: 'desc' }
      });

      const lastLog = await prisma.integrationLog.findFirst({
        where: { service: 'Delhivery' },
        orderBy: { timestamp: 'desc' }
      });

      return successResponse(res, 'Delhivery integration details retrieved successfully', {
        info: {
          connectionStatus: check.status,
          shipmentApiStatus: check.status,
          trackingApiStatus: check.status,
          lastSuccessfulShipment: lastShipment ? lastShipment.createdAt : null,
          lastSuccessfulTrackingSync: lastLog ? lastLog.timestamp : null,
          averageResponseTime: `${check.responseTime} ms`
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get Marketplace Health Metrics
  async getMarketplaceHealth(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
      const totalSellers = await prisma.seller.count();
      const activeSellers = await prisma.seller.count({ where: { status: 'APPROVED' } });
      const pendingSellerApplications = await prisma.seller.count({ where: { status: 'PENDING' } });
      const pendingProductApprovals = await prisma.product.count({ where: { status: 'PENDING_APPROVAL' } });
      const suspendedUsers = await prisma.user.count({ where: { status: 'SUSPENDED' } });

      return successResponse(res, 'Marketplace health stats retrieved successfully', {
        health: {
          totalCustomers,
          totalSellers,
          activeSellers,
          pendingSellerApplications,
          pendingProductApprovals,
          suspendedUsers
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get Payment Health Metrics
  async getPaymentHealth(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // 1. Razorpay Gateway Status Check
      let razorpayStatus = 'Down';
      try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (keyId && keySecret) {
          const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          await axios.get('https://api.razorpay.com/v1/customers', {
            headers: { Authorization: `Basic ${auth}` },
            timeout: 4000
          }).catch(err => {
            if (err.response) {
              razorpayStatus = 'Healthy';
            } else {
              throw err;
            }
          });
        } else {
          razorpayStatus = 'Warning';
        }
      } catch (e) {
        razorpayStatus = 'Down';
      }

      // 2. Webhook Status check
      const webhookStatus = process.env.RAZORPAY_WEBHOOK_SECRET ? 'Active' : 'Inactive';

      // 3. Last Successful Payment
      const lastPayment = await prisma.payment.findFirst({
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      // 4. Success / Failure Rate
      const successCount = await prisma.payment.count({ where: { status: 'SUCCESS' } });
      const failedCount = await prisma.payment.count({ where: { status: 'FAILED' } });
      const totalCount = successCount + failedCount;

      const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) + '%' : '100.0%';
      const failureRate = totalCount > 0 ? ((failedCount / totalCount) * 100).toFixed(1) + '%' : '0.0%';

      // 5. Average Verification Time
      const samplePayments = await prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        select: {
          createdAt: true,
          order: { select: { createdAt: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      let averageVerificationTime = '350 ms'; // Healthy standard default
      if (samplePayments.length > 0) {
        let totalMs = 0;
        let count = 0;
        for (const p of samplePayments) {
          if (p.order) {
            const diff = p.createdAt.getTime() - p.order.createdAt.getTime();
            if (diff > 0) {
              totalMs += diff;
              count++;
            }
          }
        }
        if (count > 0) {
          averageVerificationTime = `${Math.round(totalMs / count)} ms`;
        }
      }

      return successResponse(res, 'Payment health metrics retrieved successfully', {
        health: {
          razorpayStatus,
          webhookStatus,
          lastSuccessfulPayment: lastPayment ? lastPayment.createdAt : null,
          paymentSuccessRate: successRate,
          paymentFailureRate: failureRate,
          averageVerificationTime
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get Inventory Health Metrics
  async getInventoryHealth(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await inventorySettingsService.get();
      const lowStockThresh = settings.defaultLowStockThreshold;
      const critStockThresh = settings.criticalStockThreshold;

      const totalProducts = await prisma.product.count();
      const activeProducts = await prisma.product.count({ where: { status: 'APPROVED' } });

      const [
        outOfStockProducts,
        lowStockProducts,
        criticalStockProducts,
        reservedAgg
      ] = await Promise.all([
        prisma.inventory.count({ where: { availableStock: 0 } }),
        prisma.inventory.count({ where: { availableStock: { lte: lowStockThresh, gt: critStockThresh } } }),
        prisma.inventory.count({ where: { availableStock: { lte: critStockThresh, gt: 0 } } }),
        prisma.inventory.aggregate({ _sum: { reservedStock: true } })
      ]);

      const reservedInventoryCount = reservedAgg._sum.reservedStock || 0;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const inventoryTransactionsToday = await prisma.inventoryTransaction.count({
        where: {
          createdAt: {
            gte: todayStart
          }
        }
      });

      return successResponse(res, 'Inventory health stats retrieved successfully', {
        health: {
          totalProducts,
          activeProducts,
          outOfStockProducts,
          lowStockProducts,
          criticalStockProducts,
          reservedInventoryCount,
          inventoryTransactionsToday
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
