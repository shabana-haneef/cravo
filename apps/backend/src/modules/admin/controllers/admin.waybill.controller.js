import { waybillInventoryService, validateWaybillCount } from '../../delivery/services/waybillInventory.service.js';
import { auditLogService } from '../services/auditLog.service.js';

export const adminWaybillController = {
  /**
   * Bulk Fetch Waybills from Delhivery
   * POST /api/v1/admin/delhivery/waybills/fetch
   */
  async fetchWaybills(req, res, next) {
    try {
      const { count } = req.body;
      const validation = validateWaybillCount(count);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const adminId = req.user?.id || 'admin';
      const result = await waybillInventoryService.fetchAndStoreWaybills(validation.count, { adminId });

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Record admin audit log
      try {
        await auditLogService.createLog({
          actorId: adminId,
          actorEmail: req.user?.email || 'admin@cravomarketplace.com',
          actionType: 'DELHIVERY_WAYBILLS_FETCHED',
          targetEntity: 'DelhiveryWaybill',
          details: {
            requested: result.data.requested,
            received: result.data.received,
            stored: result.data.stored,
            duplicates: result.data.duplicates
          }
        });
      } catch (auditErr) {
        // Non-blocking
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Waybill Inventory Summary and List
   * GET /api/v1/admin/delhivery/waybills
   */
  async getInventory(req, res, next) {
    try {
      const { page, limit, status, search } = req.query;

      const [summary, waybillsResult] = await Promise.all([
        waybillInventoryService.getInventorySummary(),
        waybillInventoryService.getWaybills({ page, limit, status, search })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          summary,
          waybills: waybillsResult.items,
          pagination: waybillsResult.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
