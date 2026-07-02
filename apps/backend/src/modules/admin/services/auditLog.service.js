import prisma from '../../../lib/prisma.js';

export const auditLogService = {
  // Append-only logger
  async log({
    actorId,
    actorEmail,
    actorRole,
    actionType,
    targetType = null,
    targetId = null,
    targetName = null,
    ipAddress = null,
    userAgent = null,
    requestMethod = null,
    endpoint = null,
    status = 'SUCCESS'
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId,
          actorEmail,
          actorRole,
          actionType,
          targetType,
          targetId,
          targetName,
          ipAddress,
          userAgent,
          requestMethod,
          endpoint,
          status
        }
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  },

  // Query audit logs with search, filters, pagination
  async getLogs(params = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      actionType = '',
      targetType = '',
      status = '',
      startDate,
      endDate
    } = params;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { actionType: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { targetName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (actionType) {
      where.actionType = actionType;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / take)
      }
    };
  },

  // Calculate statistics for the audit logs dashboard
  async getStats() {
    const totalLogs = await prisma.auditLog.count();

    // Security Events
    const securityEvents = await prisma.auditLog.count({
      where: {
        actionType: {
          in: ['FAILED_ADMIN_LOGIN', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'FORBIDDEN_ROUTE_ACCESS', 'SUSPICIOUS_ACTIVITY_DETECTION']
        }
      }
    });

    // System Operations
    const systemActions = await prisma.auditLog.count({
      where: {
        actionType: {
          in: ['CLEAR_CACHE', 'DATABASE_BACKUP', 'HEALTH_CHECK_RUN', 'INTEGRATION_CREDENTIALS_UPDATE']
        }
      }
    });

    // Admin Operations (User, Seller, Product, Ad, Settings management)
    const adminActions = totalLogs - securityEvents - systemActions;

    return {
      totalLogs,
      securityEvents,
      systemActions,
      adminActions
    };
  },

  // Export logs data string (CSV or JSON)
  async exportLogs(format = 'json', params = {}) {
    // Fetch logs matching filter criteria (unpaginated for full export)
    const {
      search = '',
      actionType = '',
      targetType = '',
      status = '',
      startDate,
      endDate
    } = params;

    const where = {};

    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { actionType: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { targetName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (actionType) {
      where.actionType = actionType;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    if (format.toLowerCase() === 'csv') {
      const headers = [
        'Log ID', 'Timestamp', 'Actor ID', 'Actor Email', 'Actor Role',
        'Action Type', 'Target Type', 'Target ID', 'Target Name',
        'IP Address', 'User Agent', 'Request Method', 'Endpoint', 'Status'
      ];
      const rows = logs.map(l => [
        l.id,
        l.createdAt.toISOString(),
        l.actorId,
        l.actorEmail,
        l.actorRole,
        l.actionType,
        l.targetType || '',
        l.targetId || '',
        l.targetName || '',
        l.ipAddress || '',
        `"${(l.userAgent || '').replace(/"/g, '""')}"`,
        l.requestMethod || '',
        l.endpoint || '',
        l.status
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    // Default JSON
    return JSON.stringify(logs, null, 2);
  }
};
