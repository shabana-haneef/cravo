import prisma from '../../../lib/prisma.js';
import { redis } from '../../../config/redis.js';
import { logger } from '../../../shared/services/logger.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { delhiveryShipmentService } from './delhiveryShipmentService.js';

const RATE_LIMIT_WINDOW_SECONDS = 300; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_LIMIT_REDIS_KEY = 'delhivery:waybill:rate_limit';

// In-memory sliding window fallback when Redis is unavailable or during tests
const inMemoryTimestamps = [];

/**
 * Validates count parameter according to Delhivery Bulk Waybill specification
 * - Must be an integer
 * - 1 <= count <= 10000
 */
export function validateWaybillCount(count) {
  if (
    count === null ||
    count === undefined ||
    typeof count === 'boolean' ||
    typeof count === 'object'
  ) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_WAYBILL_COUNT',
        message: 'Waybill count must be an integer between 1 and 10000.'
      }
    };
  }

  const num = Number(count);
  if (Number.isNaN(num) || !Number.isInteger(num) || num < 1 || num > 10000) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_WAYBILL_COUNT',
        message: 'Waybill count must be an integer between 1 and 10000.'
      }
    };
  }

  return { isValid: true, count: num };
}

/**
 * Checks and updates rate limit (5 requests / 5 minutes)
 */
async function checkRateLimit() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;

  if (redis && redis.isOpen) {
    try {
      // Remove timestamps older than window
      await redis.zRemRangeByScore(RATE_LIMIT_REDIS_KEY, 0, windowStart);
      const currentCount = await redis.zCard(RATE_LIMIT_REDIS_KEY);

      if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
        throw new AppError(
          'Delhivery Bulk Waybill API rate limit reached (maximum 5 requests per 5 minutes). Please wait before fetching more waybills.',
          429
        );
      }

      await redis.zAdd(RATE_LIMIT_REDIS_KEY, { score: now, value: `${now}:${Math.random().toString(36).slice(2, 6)}` });
      await redis.expire(RATE_LIMIT_REDIS_KEY, RATE_LIMIT_WINDOW_SECONDS);
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn({ err: err.message }, 'Redis rate limit check failed, using in-memory fallback');
    }
  }

  // In-memory sliding window
  while (inMemoryTimestamps.length > 0 && inMemoryTimestamps[0] < windowStart) {
    inMemoryTimestamps.shift();
  }

  if (inMemoryTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new AppError(
      'Delhivery Bulk Waybill API rate limit reached (maximum 5 requests per 5 minutes). Please wait before fetching more waybills.',
      429
    );
  }

  inMemoryTimestamps.push(now);
}

/**
 * Parses and extracts normalized waybills from Delhivery response
 */
export function parseDelhiveryWaybills(rawResponse) {
  if (!rawResponse) return [];

  let rawList = [];
  if (typeof rawResponse === 'string') {
    // Delhivery API returns a comma-separated string: "56047210000571,56047210000582"
    rawList = rawResponse.split(/[\r\n,]+/);
  } else if (Array.isArray(rawResponse)) {
    rawList = rawResponse;
  } else if (typeof rawResponse === 'object') {
    const list = rawResponse.data || rawResponse.waybills || rawResponse.packages || [];
    if (Array.isArray(list)) {
      rawList = list;
    } else if (typeof list === 'string') {
      rawList = list.split(/[\r\n,]+/);
    }
  }

  const cleaned = rawList
    .map(w => (w !== null && w !== undefined ? String(w).trim() : ''))
    .filter(w => w.length > 0 && /^[a-zA-Z0-9_-]+$/.test(w));

  // Deduplicate within the response batch
  return [...new Set(cleaned)];
}

export const waybillInventoryService = {
  validateWaybillCount,

  /**
   * Fetches waybills in bulk from Delhivery and stores them in persistent inventory
   */
  async fetchAndStoreWaybills(countInput, { adminId } = {}) {
    const validation = validateWaybillCount(countInput);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const count = validation.count;

    // Rate limit check
    await checkRateLimit();

    const startTime = Date.now();
    logger.info({ count, adminId }, 'Initiating bulk Delhivery waybill fetch');

    // Call Delhivery API (no blind retries)
    const rawData = await delhiveryShipmentService.fetchBulkWaybills(count);

    // Parse and normalize
    const waybillNumbers = parseDelhiveryWaybills(rawData);

    if (waybillNumbers.length === 0) {
      logger.warn({ count, rawData }, 'Delhivery returned no usable waybills');
      return {
        success: true,
        data: {
          requested: count,
          received: 0,
          stored: 0,
          duplicates: 0
        }
      };
    }

    // Persist to database with duplicate protection
    const records = waybillNumbers.map(waybill => ({
      waybill,
      status: 'AVAILABLE',
      metadata: { source: 'ADMIN_BULK_FETCH', adminId: adminId || null }
    }));

    let storedCount = 0;
    try {
      const result = await prisma.delhiveryWaybill.createMany({
        data: records,
        skipDuplicates: true
      });
      storedCount = result.count;
    } catch (dbError) {
      logger.error({ err: dbError.message, count }, 'Failed to persist bulk waybills to database');
      throw new AppError(`Database persistence failure during waybill storage: ${dbError.message}`, 500);
    }

    const duplicateCount = waybillNumbers.length - storedCount;

    // Record audit log
    try {
      await prisma.integrationLog.create({
        data: {
          id: `waybill-bulk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          service: 'Delhivery',
          event: 'BULK_WAYBILL_FETCH',
          status: 'SUCCESS',
          timestamp: new Date()
        }
      });
    } catch (logErr) {
      logger.warn({ err: logErr.message }, 'Failed to write bulk waybill integration log');
    }

    logger.info(
      {
        requested: count,
        received: waybillNumbers.length,
        stored: storedCount,
        duplicates: duplicateCount,
        durationMs: Date.now() - startTime
      },
      'Completed bulk waybill fetch and persistence'
    );

    return {
      success: true,
      data: {
        requested: count,
        received: waybillNumbers.length,
        stored: storedCount,
        duplicates: duplicateCount
      }
    };
  },

  /**
   * Concurrency-safe atomic waybill reservation
   * Transitions 1 AVAILABLE waybill -> RESERVED
   */
  async reserveWaybill({ orderId, deliveryId, reservedFor } = {}) {
    // 1. Production PostgreSQL atomic claim with FOR UPDATE SKIP LOCKED
    try {
      const result = await prisma.$queryRaw`
        UPDATE "DelhiveryWaybill"
        SET "status" = 'RESERVED'::"DelhiveryWaybillStatus",
            "reservedAt" = NOW(),
            "reservedFor" = ${reservedFor || null},
            "orderId" = ${orderId || null},
            "deliveryId" = ${deliveryId || null},
            "updatedAt" = NOW()
        WHERE "id" = (
          SELECT "id" FROM "DelhiveryWaybill"
          WHERE "status" = 'AVAILABLE'::"DelhiveryWaybillStatus"
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *;
      `;

      if (result && Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return null;
    } catch (sqlErr) {
      logger.warn({ err: sqlErr.message }, 'Atomic raw query failed, executing conditional reservation fallback');
      return await this.reserveWaybillConditional({ orderId, deliveryId, reservedFor });
    }
  },

  /**
   * Conditional reservation fallback for environments/unit tests where $queryRaw is mocked
   */
  async reserveWaybillConditional({ orderId, deliveryId, reservedFor }, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const candidate = await prisma.delhiveryWaybill.findFirst({
        where: { status: 'AVAILABLE' },
        orderBy: { createdAt: 'asc' }
      });

      if (!candidate) return null;

      const updateResult = await prisma.delhiveryWaybill.updateMany({
        where: {
          id: candidate.id,
          status: 'AVAILABLE'
        },
        data: {
          status: 'RESERVED',
          reservedAt: new Date(),
          reservedFor: reservedFor || null,
          orderId: orderId || null,
          deliveryId: deliveryId || null
        }
      });

      if (updateResult.count === 1) {
        return prisma.delhiveryWaybill.findUnique({ where: { id: candidate.id } });
      }
      // Contention detected, loop and try next candidate
    }
    return null;
  },

  /**
   * Marks a RESERVED waybill as USED when Delhivery shipment creation succeeds
   */
  async markWaybillUsed(waybillNumber, { orderId, deliveryId } = {}) {
    if (!waybillNumber) return null;
    return await prisma.delhiveryWaybill.updateMany({
      where: { waybill: String(waybillNumber).trim() },
      data: {
        status: 'USED',
        usedAt: new Date(),
        ...(orderId ? { orderId } : {}),
        ...(deliveryId ? { deliveryId } : {})
      }
    });
  },

  /**
   * Releases a RESERVED waybill back to RELEASED (safe failure before Delhivery processing)
   */
  async releaseWaybill(waybillNumber, reason = 'CREATION_FAILED_SAFE') {
    if (!waybillNumber) return null;
    return await prisma.delhiveryWaybill.updateMany({
      where: {
        waybill: String(waybillNumber).trim(),
        status: 'RESERVED'
      },
      data: {
        status: 'RELEASED',
        metadata: { releaseReason: reason, releasedAt: new Date().toISOString() }
      }
    });
  },

  /**
   * Gets inventory counts, last fetch, and stock threshold status
   */
  async getInventorySummary() {
    const counts = await prisma.delhiveryWaybill.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const summary = {
      total: 0,
      AVAILABLE: 0,
      RESERVED: 0,
      USED: 0,
      RELEASED: 0,
      EXPIRED: 0
    };

    counts.forEach(c => {
      summary[c.status] = c._count.status;
      summary.total += c._count.status;
    });

    const latest = await prisma.delhiveryWaybill.findFirst({
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true }
    });

    const threshold = parseInt(process.env.DELHIVERY_WAYBILL_LOW_STOCK_THRESHOLD, 10) || 50;

    return {
      total: summary.total,
      available: summary.AVAILABLE,
      reserved: summary.RESERVED,
      used: summary.USED,
      released: summary.RELEASED,
      expired: summary.EXPIRED,
      lastFetchedAt: latest?.fetchedAt || null,
      lowStockThreshold: threshold,
      isLowStock: summary.AVAILABLE < threshold
    };
  },

  /**
   * Lists waybills with pagination and filtering for admin UI
   */
  async getWaybills({ page = 1, limit = 20, status, search } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { waybill: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        { deliveryId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.delhiveryWaybill.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.delhiveryWaybill.count({ where })
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }
};
