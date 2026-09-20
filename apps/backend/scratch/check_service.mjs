import { deliveryService } from '../src/modules/delivery/services/delivery.service.js';

console.log('handleWebhookEvent:', typeof deliveryService.handleWebhookEvent);
console.log('normalizeTrackingEvent:', typeof deliveryService.normalizeTrackingEvent);
console.log('processTrackingUpdate:', typeof deliveryService.processTrackingUpdate);
console.log('getPublicTracking:', typeof deliveryService.getPublicTracking);
console.log('getTracking:', typeof deliveryService.getTracking);
console.log('_statusMap keys:', Object.keys(deliveryService._statusMap).slice(0, 5));
console.log('_statusRank DELIVERED:', deliveryService._statusRank['DELIVERED']);
console.log('_statusRank IN_TRANSIT:', deliveryService._statusRank['IN_TRANSIT']);
console.log('TEST: fingerprint for DELIVERED:', deliveryService.normalizeTrackingEvent('AWB1', 'Delivered', 'loc', '2026-06-20T09:00:00.000Z').fingerprint.length === 64 ? 'OK' : 'FAIL');
