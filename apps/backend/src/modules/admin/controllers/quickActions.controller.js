import { successResponse } from '../../../shared/responses/apiResponse.js';
import { quickActionsService } from '../services/quickActions.service.js';
import { auditLogService } from '../services/auditLog.service.js';
import { integrationsService } from '../services/integrations.service.js';
import { orderSettingsService } from '../services/orderSettings.service.js';
import { deliverySettingsService } from '../services/deliverySettings.service.js';
import { governanceSettingsService } from '../services/governanceSettings.service.js';
import { paymentSettingsService } from '../services/paymentSettings.service.js';
import { inventorySettingsService } from '../services/inventorySettings.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import axios from 'axios';
import prisma from '../../../lib/prisma.js';


export const quickActionsController = {
  // Clear Cache
  async clearCache(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const result = await quickActionsService.clearCache();

      // Log to Audit Logs
      await auditLogService.log({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        actionType: 'CLEAR_CACHE',
        targetType: 'SYSTEM_CACHE',
        targetId: 'ALL',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        endpoint: req.originalUrl,
        status: 'SUCCESS'
      });

      return successResponse(res, 'Cache cleared successfully', result);
    } catch (error) {
      next(error);
    }
  },

  // Trigger Database Backup
  async triggerBackup(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const result = await quickActionsService.generateBackup(admin.email);

      // Log to Audit Logs
      await auditLogService.log({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        actionType: 'DATABASE_BACKUP',
        targetType: 'DATABASE',
        targetId: result.fileName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        endpoint: req.originalUrl,
        status: 'SUCCESS'
      });

      return successResponse(res, 'Database backup created successfully', result);
    } catch (error) {
      next(error);
    }
  },

  // Get list of backups
  async listBackups(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const backups = await quickActionsService.getBackups();
      return successResponse(res, 'Backups retrieved successfully', { backups });
    } catch (error) {
      next(error);
    }
  },

  // Download Backup
  async downloadBackup(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const { fileName } = req.params;
      const filePath = quickActionsService.getBackupPath(fileName);

      // Log download to Audit Logs
      await auditLogService.log({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        actionType: 'DOWNLOAD_BACKUP',
        targetType: 'DATABASE_BACKUP_FILE',
        targetId: fileName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        endpoint: req.originalUrl,
        status: 'SUCCESS'
      });

      return res.download(filePath, fileName);
    } catch (error) {
      next(error);
    }
  },

  // System Health Check (Diagnostics Report)
  async getHealth(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const diagnostics = await integrationsService.getHealthReport();

      // Log execution
      await auditLogService.log({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        actionType: 'HEALTH_CHECK_RUN',
        targetType: 'DIAGNOSTICS',
        targetId: 'SYSTEM',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        endpoint: req.originalUrl,
        status: 'SUCCESS'
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
        const { targetEmail = admin.email } = req.body;
        result = await integrationsService.sendTestEmail(admin.email, targetEmail);
      } else if (service === 'cloudinary') {
        result = await integrationsService.testCloudinaryUpload();
      } else {
        return next(new AppError('Invalid service test requested', 400));
      }

      // Log action Type
      await auditLogService.log({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        actionType: 'INTEGRATION_CREDENTIALS_UPDATE', // System operations category
        targetType: 'INTEGRATION_CONNECTION',
        targetId: service.toUpperCase(),
        targetName: `Test Connection: ${service}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        endpoint: req.originalUrl,
        status: 'SUCCESS'
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

  // Get Audit Logs
  async getAuditLogs(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const logsData = await auditLogService.getLogs(req.query);
      return successResponse(res, 'Audit logs retrieved successfully', logsData);
    } catch (error) {
      next(error);
    }
  },

  // Get Audit Logs Dashboard Statistics
  async getAuditStats(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const stats = await auditLogService.getStats();
      return successResponse(res, 'Audit stats retrieved successfully', { stats });
    } catch (error) {
      next(error);
    }
  },

  // Export Audit Logs (SUPER_ADMIN only verification)
  async exportAuditLogs(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can export audit logs.', 403));
      }

      const { format = 'json' } = req.query;
      const exportData = await auditLogService.exportLogs(format, req.query);

      // Log download to Audit Logs
      await auditLogService.log({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        actionType: 'SECURITY_EVENTS',
        targetType: 'AUDIT_TRAIL',
        targetId: 'EXPORT',
        targetName: `Export logs: ${format.toUpperCase()}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        endpoint: req.originalUrl,
        status: 'SUCCESS'
      });

      if (format.toLowerCase() === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
        return res.send(exportData);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
      return res.send(exportData);
    } catch (error) {
      next(error);
    }
  },

  // Get Order Settings
  async getOrderSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await orderSettingsService.get();
      return successResponse(res, 'Order settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Order Settings
  async updateOrderSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify order settings.', 403));
      }

      const newSettings = req.body;
      const validation = orderSettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await orderSettingsService.get();
      const savedSettings = await orderSettingsService.save(newSettings);

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        const isChanged = typeof val === 'object' 
          ? JSON.stringify(val) !== JSON.stringify(oldVal)
          : val !== oldVal;
        
        if (isChanged) {
          await auditLogService.log({
            actorId: admin.id,
            actorEmail: admin.email,
            actorRole: admin.role,
            actionType: 'SETTINGS_UPDATE',
            targetType: 'ORDER_SETTINGS',
            targetId: key,
            targetName: `Update Order Setting: ${key}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestMethod: req.method,
            endpoint: req.originalUrl,
            status: 'SUCCESS'
          });
        }
      }

      return successResponse(res, 'Order settings updated successfully', { settings: savedSettings });
    } catch (error) {
      next(error);
    }
  },

  // Get Delivery Settings
  async getDeliverySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await deliverySettingsService.get();
      return successResponse(res, 'Delivery settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Delivery Settings
  async updateDeliverySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify delivery settings.', 403));
      }

      const newSettings = req.body;
      const validation = deliverySettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await deliverySettingsService.get();
      const savedSettings = await deliverySettingsService.save(newSettings);

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        const isChanged = typeof val === 'object' 
          ? JSON.stringify(val) !== JSON.stringify(oldVal)
          : val !== oldVal;
        
        if (isChanged) {
          await auditLogService.log({
            actorId: admin.id,
            actorEmail: admin.email,
            actorRole: admin.role,
            actionType: 'SETTINGS_UPDATE',
            targetType: 'DELIVERY_SETTINGS',
            targetId: key,
            targetName: `Update Delivery Setting: ${key}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestMethod: req.method,
            endpoint: req.originalUrl,
            status: 'SUCCESS'
          });
        }
      }

      return successResponse(res, 'Delivery settings updated successfully', { settings: savedSettings });
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
        select: { createdAt: true, updatedAt: true, estimatedDeliveryDate: true }
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

  // Get Governance Settings
  async getGovernanceSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await governanceSettingsService.get();
      return successResponse(res, 'Governance settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Governance Settings
  async updateGovernanceSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify governance settings.', 403));
      }

      const newSettings = req.body;
      const validation = governanceSettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await governanceSettingsService.get();
      const savedSettings = await governanceSettingsService.save(newSettings);

      // Mapping settings key to descriptive names for logs
      const descriptiveNames = {
        requireSellerApproval: 'Seller Approval Requirement Changed',
        requireSellerDocumentVerification: 'Seller Document Verification Requirement Changed',
        allowSellerReapplication: 'Seller Reapplication Permission Changed',
        requireProductApproval: 'Product Approval Requirement Changed',
        reapproveAfterProductUpdate: 'Product Reapprove On Update Changed',
        allowProductDrafts: 'Product Draft Permission Changed',
        requireEmailVerification: 'Email Verification Requirement Changed',
        blockSuspendedUsers: 'Block Suspended Users Configuration Changed',
        allowNewCustomerRegistrations: 'New Registrations Configuration Changed',
        allowNewSellerApplications: 'Seller Applications Configuration Changed',
        allowNewProductSubmissions: 'New Product Submissions Configuration Changed'
      };

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        if (val !== oldVal) {
          await auditLogService.log({
            actorId: admin.id,
            actorEmail: admin.email,
            actorRole: admin.role,
            actionType: 'SETTINGS_UPDATE',
            targetType: 'GOVERNANCE_SETTINGS',
            targetId: key,
            targetName: descriptiveNames[key] || `Update Governance Setting: ${key}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestMethod: req.method,
            endpoint: req.originalUrl,
            status: 'SUCCESS'
          });
        }
      }

      return successResponse(res, 'Governance settings updated successfully', { settings: savedSettings });
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

  // Get Payment Settings
  async getPaymentSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await paymentSettingsService.get();
      return successResponse(res, 'Payment settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Payment Settings
  async updatePaymentSettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify payment settings.', 403));
      }

      const newSettings = req.body;
      const validation = paymentSettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await paymentSettingsService.get();
      const savedSettings = await paymentSettingsService.save(newSettings);

      // Mapping settings key to descriptive names for logs
      const descriptiveNames = {
        enableRazorpay: 'Razorpay Enabled status changed',
        enableCod: 'Cash on Delivery Enabled status changed',
        maxCodAmount: 'Maximum COD Order Amount changed',
        minOrderAmount: 'Minimum Order Amount limit changed',
        maxOrderAmount: 'Maximum Order Amount limit changed',
        maxSingleTransactionAmount: 'Maximum Single Transaction limit changed',
        enableRefundRequests: 'Refund requests allowed status changed',
        refundRequestWindowDays: 'Refund request window changed',
        requireAdminRefundApproval: 'Admin Refund Approval status changed',
        autoRefundProcessing: 'Auto Refund Processing status changed',
        commissionType: 'Commission Type changed',
        commissionValue: 'Commission Value changed',
        applyCommissionOn: 'Apply Commission Target changed',
        enableSellerPayouts: 'Seller Payouts allowed status changed',
        minPayoutThreshold: 'Minimum Payout Threshold changed',
        payoutReleaseDelayDays: 'Payout Release Delay changed',
        autoPayoutProcessing: 'Automatic Payout Processing changed',
        maxFailedPaymentAttempts: 'Maximum Failed Payment Attempts changed',
        manualReviewThreshold: 'Manual Review Threshold changed',
        blockExcessiveFailedAttempts: 'Block Excessive Failed Attempts status changed'
      };

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        if (val !== oldVal) {
          await auditLogService.log({
            actorId: admin.id,
            actorEmail: admin.email,
            actorRole: admin.role,
            actionType: 'SETTINGS_UPDATE',
            targetType: 'PAYMENT_SETTINGS',
            targetId: key,
            targetName: descriptiveNames[key] || `Update Payment Setting: ${key}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestMethod: req.method,
            endpoint: req.originalUrl,
            details: `Changed ${key} from ${oldVal} to ${val}`,
            status: 'SUCCESS'
          });
        }
      }

      return successResponse(res, 'Payment settings updated successfully', { settings: savedSettings });
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

  // Get Inventory Settings
  async getInventorySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const settings = await inventorySettingsService.get();
      return successResponse(res, 'Inventory settings retrieved successfully', { settings });
    } catch (error) {
      next(error);
    }
  },

  // Update Inventory Settings
  async updateInventorySettings(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      // Enforce SUPER_ADMIN check for modification
      if (admin.email !== 'shabanahaneef10@gmail.com') {
        return next(new AppError('Unauthorized: Only the Super Admin can modify inventory settings.', 403));
      }

      const newSettings = req.body;
      const validation = inventorySettingsService.validate(newSettings);
      if (!validation.isValid) {
        return next(new AppError(validation.errors.join(' '), 400));
      }

      const oldSettings = await inventorySettingsService.get();
      const savedSettings = await inventorySettingsService.save(newSettings);

      // Mapping settings key to descriptive names for logs
      const descriptiveNames = {
        enableLowStockAlerts: 'Low stock alerts status changed',
        defaultLowStockThreshold: 'Default low stock threshold changed',
        criticalStockThreshold: 'Critical stock threshold changed',
        enableStockReservation: 'Stock reservation status changed',
        reservationExpiryTime: 'Reservation expiry time changed',
        autoReleaseExpiredReservations: 'Auto release expired reservations status changed',
        allowPurchaseWhenOutOfStock: 'Allow purchase when out of stock status changed',
        showOutOfStockProducts: 'Show out of stock products status changed',
        hideProductsAfterStockReachesZero: 'Hide products after stock reaches zero status changed',
        allowSellerInventoryUpdates: 'Allow seller inventory updates status changed',
        requireInventoryChangeLogging: 'Require inventory change logging status changed',
        requireReasonForManualAdjustment: 'Require reason for manual adjustment status changed',
        trackVariantInventorySeparately: 'Track variant inventory separately status changed',
        preventOversellingVariants: 'Prevent overselling variants status changed',
        requireVariantStockBeforeListing: 'Require variant stock before listing status changed',
        enableLowStockNotifications: 'Enable low stock notifications status changed',
        enableCriticalStockNotifications: 'Enable critical stock notifications status changed',
        notificationFrequency: 'Notification frequency changed',
        enableInventoryLogs: 'Enable inventory logs status changed',
        logRetentionPeriod: 'Log retention period changed',
        validateStockBeforePaymentVerification: 'Validate stock before payment verification status changed'
      };

      // Log changes to Audit Logs
      for (const [key, val] of Object.entries(newSettings)) {
        const oldVal = oldSettings[key];
        if (val !== oldVal) {
          await auditLogService.log({
            actorId: admin.id,
            actorEmail: admin.email,
            actorRole: admin.role,
            actionType: 'SETTINGS_UPDATE',
            targetType: 'INVENTORY_SETTINGS',
            targetId: key,
            targetName: descriptiveNames[key] || `Update Inventory Setting: ${key}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestMethod: req.method,
            endpoint: req.originalUrl,
            details: `Changed ${key} from ${oldVal} to ${val}`,
            status: 'SUCCESS'
          });
        }
      }

      return successResponse(res, 'Inventory settings updated successfully', { settings: savedSettings });
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

      const allInventory = await prisma.inventory.findMany({
        select: {
          availableStock: true,
          reservedStock: true
        }
      });

      let outOfStockProducts = 0;
      let lowStockProducts = 0;
      let criticalStockProducts = 0;
      let reservedInventoryCount = 0;

      allInventory.forEach(item => {
        const stock = item.availableStock;
        reservedInventoryCount += item.reservedStock;
        if (stock === 0) {
          outOfStockProducts++;
        }
        if (stock <= critStockThresh) {
          criticalStockProducts++;
        } else if (stock <= lowStockThresh) {
          lowStockProducts++;
        }
      });

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
