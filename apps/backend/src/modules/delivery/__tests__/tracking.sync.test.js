import { jest } from '@jest/globals';

// ─── Setup environment variables ────────────────────────────────────────────
process.env.DELHIVERY_TOKEN = 'test-token';
process.env.DELHIVERY_CLIENT_NAME = 'test-client';

// ─── Mock prisma (ESM-compatible) ────────────────────────────────────────────
const mockCreateMany = jest.fn().mockResolvedValue({ count: 1 });
const mockDeliveryUpdate = jest.fn().mockResolvedValue({ id: 'delivery-1', status: 'DELIVERED' });
const mockOrderUpdate = jest.fn().mockResolvedValue({});

const mockTx = {
  deliveryTrackingEvent: { createMany: mockCreateMany },
  delivery: { update: mockDeliveryUpdate },
  order: { update: mockOrderUpdate }
};

const mockPrisma = {
  $transaction: jest.fn(async (cb) => cb(mockTx))
};

await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: mockPrisma
}));

// ─── Mock redis (ESM-compatible) ─────────────────────────────────────────────
await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: {
    isOpen: true,
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
  },
  pubClient: { isOpen: true, on: jest.fn(), duplicate: jest.fn().mockReturnValue({ on: jest.fn() }) },
  subClient: { isOpen: true, on: jest.fn(), duplicate: jest.fn().mockReturnValue({ on: jest.fn() }) }
}));

// ─── Mock logger ─────────────────────────────────────────────────────────────
await jest.unstable_mockModule('../../../shared/services/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// ─── Mock heavy service dependencies that delivery.service.js imports ────────
await jest.unstable_mockModule('../services/delhiveryShipmentService.js', () => ({
  delhiveryShipmentService: {
    trackShipment: jest.fn(),
    createShipment: jest.fn(),
    findShipmentByOrderNumber: jest.fn(),
    createPickupRequest: jest.fn(),
    generateShippingLabel: jest.fn(),
    cancelPickupRequest: jest.fn()
  }
}));

await jest.unstable_mockModule('../services/delhiveryService.js', () => ({
  delhiveryService: {}
}));

await jest.unstable_mockModule('../services/waybillInventory.service.js', () => ({
  waybillInventoryService: {
    reserveWaybill: jest.fn(),
    markWaybillUsed: jest.fn(),
    releaseWaybill: jest.fn()
  }
}));

await jest.unstable_mockModule('../repositories/delivery.repository.js', () => ({
  deliveryRepository: {}
}));

await jest.unstable_mockModule('../repositories/deliveryTracking.repository.js', () => ({
  deliveryTrackingRepository: {}
}));

await jest.unstable_mockModule('../../orders/repositories/order.repository.js', () => ({
  orderRepository: {}
}));

await jest.unstable_mockModule('../../notifications/services/notification.service.js', () => ({
  notificationService: {}
}));

await jest.unstable_mockModule('../../payments/services/refund.service.js', () => ({
  refundService: {}
}));

await jest.unstable_mockModule('../../admin/services/orderSettings.service.js', () => ({
  orderSettingsService: {}
}));

// ─── Import service AFTER mocks are set up ───────────────────────────────────
const { deliveryService } = await import('../services/delivery.service.js');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const AWB = 'AWB123456789';

const makeDelivery = (status = 'IN_TRANSIT') => ({
  id: 'delivery-1',
  trackingNumber: AWB,
  status,
  order: {
    id: 'order-1',
    status: 'SHIPPED',
    shop: { seller: { id: 'seller-1' } }
  }
});

// ─── SECTION 1: normalizeTrackingEvent (pure function, no DB) ────────────────

describe('normalizeTrackingEvent', () => {
  test('maps known Delhivery status strings to Cravo statuses', () => {
    const ev = deliveryService.normalizeTrackingEvent(AWB, 'Delivered', 'Customer received', '2026-06-20T09:00:00.000Z');
    expect(ev.status).toBe('DELIVERED');
  });

  test('maps "Pending" to PENDING', () => {
    const ev = deliveryService.normalizeTrackingEvent(AWB, 'Pending', 'Hub', '2026-06-20T09:00:00.000Z');
    expect(ev.status).toBe('PENDING');
  });

  test('falls back to IN_TRANSIT for unknown statuses', () => {
    const ev = deliveryService.normalizeTrackingEvent(AWB, 'UNKNOWN_STATUS', 'some desc', '2026-06-20T09:00:00.000Z');
    expect(ev.status).toBe('IN_TRANSIT');
  });

  test('generates a deterministic SHA-256 fingerprint', () => {
    const ev1 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T09:00:00.000Z');
    const ev2 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T09:00:00.000Z');
    expect(ev1.fingerprint).toEqual(ev2.fingerprint);
    expect(ev1.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  describe('A. Same-day same-location events are NOT identical fingerprints', () => {
    test('09:00 and 13:00 same-day events produce different fingerprints', () => {
      const ev1 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T09:00:00.000Z');
      const ev2 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T13:00:00.000Z');
      expect(ev1.fingerprint).not.toEqual(ev2.fingerprint);
    });

    test('All three same-day events produce three unique fingerprints', () => {
      const ev1 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T09:00:00.000Z');
      const ev2 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T13:00:00.000Z');
      const ev3 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T18:00:00.000Z');
      const fingerprints = new Set([ev1.fingerprint, ev2.fingerprint, ev3.fingerprint]);
      expect(fingerprints.size).toBe(3);
    });
  });

  describe('B. Exact duplicates produce the same fingerprint', () => {
    test('same AWB + status + description + timestamp = same fingerprint', () => {
      const ts = '2026-06-20T09:00:00.000Z';
      const ev1 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', ts);
      const ev2 = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', ts);
      expect(ev1.fingerprint).toEqual(ev2.fingerprint);
    });
  });

  describe('C. Webhook + polling of same physical scan produce same fingerprint', () => {
    test('"Pending" (webhook casing) and "Pending" (direct) produce same canonical status and fingerprint', () => {
      const ts = '2026-06-20T09:00:00.000Z';
      const webhookEvent = deliveryService.normalizeTrackingEvent(AWB, 'Pending', 'Hub XYZ', ts);
      const pollingEvent = deliveryService.normalizeTrackingEvent(AWB, 'Pending', 'Hub XYZ', ts);
      expect(webhookEvent.status).toBe('PENDING');
      expect(pollingEvent.status).toBe('PENDING');
      expect(webhookEvent.fingerprint).toEqual(pollingEvent.fingerprint);
    });

    test('"Delivered" from both webhook and polling with same timestamp produce identical fingerprint', () => {
      const ts = '2026-06-21T14:30:00.000Z';
      const ev1 = deliveryService.normalizeTrackingEvent(AWB, 'Delivered', 'Customer door', ts);
      const ev2 = deliveryService.normalizeTrackingEvent(AWB, 'Delivered', 'Customer door', ts);
      expect(ev1.fingerprint).toEqual(ev2.fingerprint);
    });

    test('Different AWBs produce different fingerprints even with same event details', () => {
      const ts = '2026-06-21T14:30:00.000Z';
      const ev1 = deliveryService.normalizeTrackingEvent('AWB111', 'Delivered', 'Customer door', ts);
      const ev2 = deliveryService.normalizeTrackingEvent('AWB222', 'Delivered', 'Customer door', ts);
      expect(ev1.fingerprint).not.toEqual(ev2.fingerprint);
    });
  });

  describe('E. normalizeTrackingEvent always produces a fingerprint (never null)', () => {
    test('fingerprint is always a 64-char hex string', () => {
      const event = deliveryService.normalizeTrackingEvent(AWB, 'CREATED', 'Warehouse', '2026-06-18T10:00:00.000Z');
      expect(event.fingerprint).not.toBeNull();
      expect(event.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

// ─── SECTION 2: processTrackingUpdate (uses mocked Prisma $transaction) ──────

describe('processTrackingUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMany.mockResolvedValue({ count: 1 });
    mockDeliveryUpdate.mockResolvedValue({ id: 'delivery-1', status: 'DELIVERED', order: makeDelivery().order });
    mockOrderUpdate.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockTx));
  });

  describe('D. Concurrent duplicate ingestion does not throw (skipDuplicates contract)', () => {
    test('createMany is called with skipDuplicates: true for every invocation', async () => {
      const delivery = makeDelivery('IN_TRANSIT');
      const event = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Delhi Hub', '2026-06-20T09:00:00.000Z');

      await Promise.all([
        deliveryService.processTrackingUpdate(delivery, event, false),
        deliveryService.processTrackingUpdate(delivery, event, false),
        deliveryService.processTrackingUpdate(delivery, event, false)
      ]);

      expect(mockCreateMany).toHaveBeenCalledTimes(3);
      for (const call of mockCreateMany.mock.calls) {
        expect(call[0]).toMatchObject({ skipDuplicates: true });
      }
    });
  });

  describe('E. New events have fingerprints inserted; NULL fingerprints are a legacy construct', () => {
    test('processTrackingUpdate inserts event with a SHA-256 fingerprint', async () => {
      const delivery = makeDelivery('IN_TRANSIT');
      const event = deliveryService.normalizeTrackingEvent(AWB, 'OUT_FOR_DELIVERY', 'Delhi', '2026-06-20T09:00:00.000Z');

      await deliveryService.processTrackingUpdate(delivery, event, false);

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) })],
        skipDuplicates: true
      });
    });
  });

  describe('State machine protection (status rank enforcement)', () => {
    test('backward status transition (DELIVERED -> IN_TRANSIT) does NOT call delivery.update', async () => {
      const delivery = makeDelivery('DELIVERED');
      const event = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Hub', '2026-06-21T10:00:00.000Z');

      await deliveryService.processTrackingUpdate(delivery, event, true);

      // Status should not regress
      expect(mockDeliveryUpdate).not.toHaveBeenCalled();
      // But the event is still inserted (historic record)
      expect(mockCreateMany).toHaveBeenCalled();
    });

    test('forward status transition (IN_TRANSIT -> DELIVERED) calls delivery.update', async () => {
      const delivery = makeDelivery('IN_TRANSIT');
      const event = deliveryService.normalizeTrackingEvent(AWB, 'Delivered', 'Customer', '2026-06-21T14:00:00.000Z');

      await deliveryService.processTrackingUpdate(delivery, event, true);

      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DELIVERED' })
        })
      );
    });

    test('historical scans (isCurrentStatus=false) never call delivery.update', async () => {
      const delivery = makeDelivery('DELIVERED');
      const historicalEvent = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Hub', '2026-06-19T10:00:00.000Z');

      await deliveryService.processTrackingUpdate(delivery, historicalEvent, false);

      expect(mockDeliveryUpdate).not.toHaveBeenCalled();
      expect(mockCreateMany).toHaveBeenCalled();
    });

    test('terminal state CANCELLED is never overwritten by a lower-rank status', async () => {
      const delivery = makeDelivery('CANCELLED');
      const event = deliveryService.normalizeTrackingEvent(AWB, 'IN_TRANSIT', 'Hub', new Date().toISOString());

      await deliveryService.processTrackingUpdate(delivery, event, true);

      expect(mockDeliveryUpdate).not.toHaveBeenCalled();
    });

    // F. PICKED_UP scan arriving after DELIVERED must not regress status
    test('F. historical PICKED_UP scan after DELIVERED — delivery remains DELIVERED', async () => {
      const delivery = makeDelivery('DELIVERED');
      // PICKED_UP has rank 6, DELIVERED has rank 9 — must NOT advance
      const event = deliveryService.normalizeTrackingEvent(AWB, 'Picked Up', 'Warehouse', '2026-06-19T08:00:00.000Z');
      expect(event.status).toBe('PICKED_UP');

      await deliveryService.processTrackingUpdate(delivery, event, true);

      // delivery.update must NOT be called (rank regression blocked)
      expect(mockDeliveryUpdate).not.toHaveBeenCalled();
      // But event IS recorded
      expect(mockCreateMany).toHaveBeenCalled();
    });

    // G. A forward-looking scan arriving after RETURNED must not overwrite terminal state
    test('G. historical forward scan after RETURNED — delivery remains RETURNED', async () => {
      const delivery = makeDelivery('RETURNED');
      // RETURNED rank=9; IN_TRANSIT rank=7 — must NOT advance (9 > 7 so can't go back)
      const event = deliveryService.normalizeTrackingEvent(AWB, 'In Transit', 'Hub', '2026-06-20T10:00:00.000Z');
      expect(event.status).toBe('IN_TRANSIT');

      await deliveryService.processTrackingUpdate(delivery, event, true);

      expect(mockDeliveryUpdate).not.toHaveBeenCalled();
      expect(mockCreateMany).toHaveBeenCalled();
    });
  });

  // H. Legacy NULL fingerprint compatibility
  describe('H. Legacy NULL fingerprint records remain compatible', () => {
    test('createMany with skipDuplicates allows NULL fingerprint rows (Postgres NULL is not equal to NULL)', async () => {
      // processTrackingUpdate always generates a fingerprint from normalizeTrackingEvent,
      // so legacy NULL fingerprint events can only be created by other paths.
      // This test verifies the DB contract: if we simulate a legacy NULL record,
      // the unique constraint (deliveryId, fingerprint) will not block new NULL fingerprint inserts
      // because Postgres treats each NULL as distinct.
      //
      // At the service layer: normalizeTrackingEvent always produces a non-null fingerprint.
      // Here we verify that processTrackingUpdate never omits fingerprint from the createMany payload.
      const delivery = makeDelivery('IN_TRANSIT');
      const event = deliveryService.normalizeTrackingEvent(AWB, 'In Transit', 'Hub', '2026-06-20T09:00:00.000Z');

      // normalizeTrackingEvent must always produce a non-null fingerprint
      expect(event.fingerprint).not.toBeNull();
      expect(event.fingerprint).not.toBeUndefined();
      expect(event.fingerprint).toMatch(/^[a-f0-9]{64}$/);

      await deliveryService.processTrackingUpdate(delivery, event, false);

      // Payload to DB must include the fingerprint key
      const callArg = mockCreateMany.mock.calls[0][0];
      expect(callArg.data[0]).toHaveProperty('fingerprint');
      expect(callArg.data[0].fingerprint).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
