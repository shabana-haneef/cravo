import { successResponse } from '../../../shared/responses/apiResponse.js';
import { quickActionsService } from '../services/quickActions.service.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const systemController = {
  // Clear Cache
  async clearCache(req, res, next) {
    try {
      const admin = req.user;
      if (!admin || admin.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      const result = await quickActionsService.clearCache();

      // Log to Audit Logs
      await auditLogService.logFromRequest(req, {
        actionType: 'CLEAR_CACHE',
        targetType: 'SYSTEM_CACHE',
        targetId: 'ALL'
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
      await auditLogService.logFromRequest(req, {
        actionType: 'DATABASE_BACKUP',
        targetType: 'DATABASE',
        targetId: result.fileName
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
      await auditLogService.logFromRequest(req, {
        actionType: 'DOWNLOAD_BACKUP',
        targetType: 'DATABASE_BACKUP_FILE',
        targetId: fileName
      });

      return res.download(filePath, fileName);
    } catch (error) {
      next(error);
    }
  }
};
