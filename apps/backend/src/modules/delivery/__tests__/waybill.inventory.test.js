import { jest } from '@jest/globals';
import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';

// Setup environment
process.env.DELHIVERY_API_TOKEN = 'test_delhivery_token_waybill';
process.env.DELHIVERY_ENV = 'prod';

// Mock Redis
const mockRedis = {
  isOpen: true,
  zRemRangeByScore: jest.fn().mockResolvedValue(0),
  zCard: jest.fn().mockResolvedValue(0),
  zAdd: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(true)
};

await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: mockRedis
}));

// Mock logger
await jest.unstable_mockModule('../../../shared/services/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock prisma
const mockPrisma = {
  delhiveryWaybill: {
    createMany: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn()
  },
  integrationLog: {
    create: jest.fn().mockResolvedValue({})
  },
  $queryRaw: jest.fn()
};

await jest.unstable_mockModule('../../../config/prisma.js', () => ({
  default: mockPrisma
}));

await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: mockPrisma
}));

// Import services after mocks
const {
  waybillInventoryService,
  validateWaybillCount,
  parseDelhiveryWaybills
} = await import('../services/waybillInventory.service.js');

const { delhiveryShipmentService } = await import('../services/delhiveryShipmentService.js');

describe('Delhivery Bulk Waybill Inventory System', () => {
  let axiosGetSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    axiosGetSpy = jest.spyOn(axios.Axios.prototype, 'get');
  });

  afterEach(() => {
    axiosGetSpy?.mockRestore();
  });

  describe('1. Count Validation', () => {
    it('accepts valid integers within range 1 to 10000', () => {
      [1, 25, 100, 1000, 10000].forEach(val => {
        const result = validateWaybillCount(val);
        expect(result.isValid).toBe(true);
        expect(result.count).toBe(val);
      });
    });

    it('rejects count < 1', () => {
      [0, -1, -50].forEach(val => {
        const result = validateWaybillCount(val);
        expect(result.isValid).toBe(false);
        expect(result.error.code).toBe('INVALID_WAYBILL_COUNT');
      });
    });

    it('rejects count > 10000', () => {
      [10001, 20000].forEach(val => {
        const result = validateWaybillCount(val);
        expect(result.isValid).toBe(false);
        expect(result.error.code).toBe('INVALID_WAYBILL_COUNT');
      });
    });

    it('rejects non-integer numbers, non-numeric strings, null, and booleans', () => {
      [1.5, 'abc', null, undefined, true, false, {}].forEach(val => {
        const result = validateWaybillCount(val);
        expect(result.isValid).toBe(false);
        expect(result.error.code).toBe('INVALID_WAYBILL_COUNT');
      });
    });
  });

  describe('2. Response Parsing & Normalization', () => {
    it('parses comma-separated string response from Delhivery', () => {
      const raw = '56047210000571,56047210000582, 56047210000593';
      const parsed = parseDelhiveryWaybills(raw);
      expect(parsed).toEqual(['56047210000571', '56047210000582', '56047210000593']);
    });

    it('parses array of waybills and removes duplicates and empties', () => {
      const raw = ['WB-001', 'WB-002', 'WB-001', '', null, '  WB-003  '];
      const parsed = parseDelhiveryWaybills(raw);
      expect(parsed).toEqual(['WB-001', 'WB-002', 'WB-003']);
    });

    it('handles empty or malformed inputs safely', () => {
      expect(parseDelhiveryWaybills(null)).toEqual([]);
      expect(parseDelhiveryWaybills('')).toEqual([]);
      expect(parseDelhiveryWaybills('   ')).toEqual([]);
    });
  });

  describe('3. Bulk Waybill Fetch & Storage', () => {
    it('fetches from Delhivery and stores waybills as AVAILABLE', async () => {
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: '56047210000571,56047210000582'
      });

      mockPrisma.delhiveryWaybill.createMany.mockResolvedValueOnce({ count: 2 });

      const result = await waybillInventoryService.fetchAndStoreWaybills(2, { adminId: 'admin_1' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        requested: 2,
        received: 2,
        stored: 2,
        duplicates: 0
      });

      expect(mockPrisma.delhiveryWaybill.createMany).toHaveBeenCalledWith({
        data: [
          { waybill: '56047210000571', status: 'AVAILABLE', metadata: { source: 'ADMIN_BULK_FETCH', adminId: 'admin_1' } },
          { waybill: '56047210000582', status: 'AVAILABLE', metadata: { source: 'ADMIN_BULK_FETCH', adminId: 'admin_1' } }
        ],
        skipDuplicates: true
      });
    });

    it('correctly tracks duplicates when database skips existing waybills', async () => {
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: '56047210000571,56047210000582,56047210000593'
      });

      // 1 of 3 was already in DB
      mockPrisma.delhiveryWaybill.createMany.mockResolvedValueOnce({ count: 2 });

      const result = await waybillInventoryService.fetchAndStoreWaybills(3);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        requested: 3,
        received: 3,
        stored: 2,
        duplicates: 1
      });
    });

    it('handles Delhivery API 4xx/5xx failure without saving waybills', async () => {
      axiosGetSpy.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Invalid Token' }
        },
        message: 'Request failed with status code 401'
      });

      await expect(waybillInventoryService.fetchAndStoreWaybills(10)).rejects.toThrow(
        'Delhivery Bulk Waybill API error: Invalid Token'
      );

      expect(mockPrisma.delhiveryWaybill.createMany).not.toHaveBeenCalled();
    });

    it('handles database persistence failure cleanly', async () => {
      axiosGetSpy.mockResolvedValueOnce({
        status: 200,
        data: '56047210000571,56047210000582'
      });

      mockPrisma.delhiveryWaybill.createMany.mockRejectedValueOnce(
        new Error('Connection terminated')
      );

      await expect(waybillInventoryService.fetchAndStoreWaybills(2)).rejects.toThrow(
        'Database persistence failure during waybill storage'
      );
    });
  });

  describe('4. Rate Limit Protection (5 requests / 5 minutes)', () => {
    it('blocks the 6th request within the 5-minute window', async () => {
      mockRedis.zCard.mockResolvedValueOnce(5);

      await expect(waybillInventoryService.fetchAndStoreWaybills(10)).rejects.toThrow(
        'Delhivery Bulk Waybill API rate limit reached'
      );

      expect(axiosGetSpy).not.toHaveBeenCalled();
    });
  });

  describe('5. Concurrency Safe Waybill Reservation', () => {
    it('reserves a waybill atomically via PostgreSQL queryRaw', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'cuid_1', waybill: '56047210000571', status: 'RESERVED', orderId: 'order_1' }
      ]);

      const reserved = await waybillInventoryService.reserveWaybill({
        orderId: 'order_1',
        reservedFor: 'ORDER_123'
      });

      expect(reserved).toBeDefined();
      expect(reserved.waybill).toBe('56047210000571');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('uses conditional update fallback when queryRaw fails (mocking race condition)', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('raw query not supported in test'));

      // Attempt 1: candidate 1 is raced by another process (updateMany returns count 0)
      mockPrisma.delhiveryWaybill.findFirst
        .mockResolvedValueOnce({ id: 'wb_1', waybill: 'WB-001', status: 'AVAILABLE' })
        .mockResolvedValueOnce({ id: 'wb_2', waybill: 'WB-002', status: 'AVAILABLE' });

      mockPrisma.delhiveryWaybill.updateMany
        .mockResolvedValueOnce({ count: 0 }) // Raced!
        .mockResolvedValueOnce({ count: 1 }); // Succeeded!

      mockPrisma.delhiveryWaybill.findUnique.mockResolvedValueOnce({
        id: 'wb_2',
        waybill: 'WB-002',
        status: 'RESERVED'
      });

      const reserved = await waybillInventoryService.reserveWaybill({
        orderId: 'order_2'
      });

      expect(reserved).toBeDefined();
      expect(reserved.waybill).toBe('WB-002');
      expect(mockPrisma.delhiveryWaybill.updateMany).toHaveBeenCalledTimes(2);
    });

    it('handles 10 simultaneous reservations against 5 available waybills without duplicates', async () => {
      // Simulate 5 available waybills in DB
      let availableWaybills = [
        { id: 'wb_1', waybill: 'AWB-001', status: 'AVAILABLE' },
        { id: 'wb_2', waybill: 'AWB-002', status: 'AVAILABLE' },
        { id: 'wb_3', waybill: 'AWB-003', status: 'AVAILABLE' },
        { id: 'wb_4', waybill: 'AWB-004', status: 'AVAILABLE' },
        { id: 'wb_5', waybill: 'AWB-005', status: 'AVAILABLE' }
      ];

      // Simulate atomic claim using atomic $queryRaw mock
      mockPrisma.$queryRaw.mockImplementation(async () => {
        const idx = availableWaybills.findIndex(w => w.status === 'AVAILABLE');
        if (idx === -1) return [];
        availableWaybills[idx].status = 'RESERVED';
        return [{ ...availableWaybills[idx] }];
      });

      // Launch 10 simultaneous reservation calls
      const requests = Array.from({ length: 10 }, (_, i) =>
        waybillInventoryService.reserveWaybill({ orderId: `order_${i + 1}` })
      );

      const results = await Promise.all(requests);

      const successful = results.filter(Boolean);
      const failed = results.filter(r => r === null);

      expect(successful).toHaveLength(5);
      expect(failed).toHaveLength(5);

      // Verify all 5 assigned waybills are unique
      const assignedWaybills = successful.map(r => r.waybill);
      const uniqueWaybills = new Set(assignedWaybills);
      expect(uniqueWaybills.size).toBe(5);
    });
  });

  describe('6. Waybill Lifecycle Transitions (USED & RELEASED)', () => {
    it('marks a reserved waybill as USED with orderId and deliveryId', async () => {
      mockPrisma.delhiveryWaybill.updateMany.mockResolvedValueOnce({ count: 1 });

      await waybillInventoryService.markWaybillUsed('56047210000571', {
        orderId: 'ord_1',
        deliveryId: 'del_1'
      });

      expect(mockPrisma.delhiveryWaybill.updateMany).toHaveBeenCalledWith({
        where: { waybill: '56047210000571' },
        data: expect.objectContaining({
          status: 'USED',
          orderId: 'ord_1',
          deliveryId: 'del_1'
        })
      });
    });

    it('releases a reserved waybill safely when shipment creation fails before Delhivery accepts', async () => {
      mockPrisma.delhiveryWaybill.updateMany.mockResolvedValueOnce({ count: 1 });

      await waybillInventoryService.releaseWaybill('56047210000571', 'PRE_DELHIVERY_FAILURE: Bad address');

      expect(mockPrisma.delhiveryWaybill.updateMany).toHaveBeenCalledWith({
        where: { waybill: '56047210000571', status: 'RESERVED' },
        data: expect.objectContaining({
          status: 'RELEASED',
          metadata: expect.objectContaining({ releaseReason: 'PRE_DELHIVERY_FAILURE: Bad address' })
        })
      });
    });
  });

  describe('7. Inventory Summary and Metrics', () => {
    it('calculates inventory counts, last fetched date, and low stock flag', async () => {
      mockPrisma.delhiveryWaybill.groupBy.mockResolvedValueOnce([
        { status: 'AVAILABLE', _count: { status: 30 } },
        { status: 'RESERVED', _count: { status: 5 } },
        { status: 'USED', _count: { status: 20 } },
        { status: 'RELEASED', _count: { status: 2 } },
        { status: 'EXPIRED', _count: { status: 0 } }
      ]);

      mockPrisma.delhiveryWaybill.findFirst.mockResolvedValueOnce({
        fetchedAt: new Date('2026-09-20T09:00:00.000Z')
      });

      const summary = await waybillInventoryService.getInventorySummary();

      expect(summary.total).toBe(57);
      expect(summary.available).toBe(30);
      expect(summary.reserved).toBe(5);
      expect(summary.used).toBe(20);
      expect(summary.released).toBe(2);
      expect(summary.isLowStock).toBe(true); // 30 < default threshold 50
    });
  });
});
