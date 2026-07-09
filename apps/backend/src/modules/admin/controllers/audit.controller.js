import { successResponse } from '../../../shared/responses/apiResponse.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const auditController = {
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
      await auditLogService.logFromRequest(req, {
        actionType: 'SECURITY_EVENTS',
        targetType: 'AUDIT_TRAIL',
        targetId: 'EXPORT',
        targetName: `Export logs: ${format.toUpperCase()}`
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
  }
};
