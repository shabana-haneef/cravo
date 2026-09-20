import { deliveryRepository } from '../repositories/delivery.repository.js';
import { deliveryService } from '../services/delivery.service.js';
import { delhiveryService } from '../services/delhivery.service.js';
import { deliverySettingsService } from '../../admin/services/deliverySettings.service.js';
import { delhiveryShipmentService } from '../services/delhiveryShipmentService.js';
import prisma from '../../../lib/prisma.js';
import { logger } from '../../../shared/services/logger.js';
import { createQueue, createWorker } from '../../../shared/utils/queue.manager.js';

export const deliverySyncQueue = createQueue('deliverySync');

export const initDeliverySyncWorker = () => {
  createWorker('deliverySync', async (job) => {
    try {
      const settings = await deliverySettingsService.get();
      if (!settings.autoSyncTracking) {
        logger.info('[DeliverySyncWorker] Delivery tracking sync is disabled via settings.');
        return { status: 'disabled' };
      }

      logger.info('[DeliverySyncWorker] Starting scheduled delivery sync job');
      
      const activeDeliveries = await prisma.delivery.findMany({
        where: {
          trackingNumber: { not: null },
          status: {
            notIn: ['DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED']
          }
        },
        include: { order: { include: { shop: { include: { seller: true } } } } }
      });

      if (activeDeliveries.length === 0) {
        return { syncedDeliveries: 0 };
      }

      let syncedDeliveries = 0;
      const batchSize = 50;

      for (let i = 0; i < activeDeliveries.length; i += batchSize) {
        const batch = activeDeliveries.slice(i, i + batchSize);
        const waybills = batch.map(d => d.trackingNumber);
        
        try {
          const results = await delhiveryShipmentService.trackShipment(waybills);
          if (!results) continue;
          
          const resultsArray = Array.isArray(results) ? results : [results];
          
          for (const delivery of batch) {
            const trackingData = resultsArray.find(r => String(r.awb) === String(delivery.trackingNumber));
            if (!trackingData) {
              logger.warn({ awb: delivery.trackingNumber }, 'No tracking data returned for AWB in batch');
              continue;
            }

            // Sync Historical Events
            for (const scan of trackingData.events || []) {
              const normalized = deliveryService.normalizeTrackingEvent(delivery.trackingNumber, scan.status, scan.location, scan.date);
              await deliveryService.processTrackingUpdate(delivery, normalized, false);
            }
            
            // Sync Current Status
            if (trackingData.status) {
              const normalizedCurrent = deliveryService.normalizeTrackingEvent(
                delivery.trackingNumber, 
                trackingData.rawStatus || trackingData.status, 
                trackingData.currentLocation, 
                new Date()
              );
              await deliveryService.processTrackingUpdate(delivery, normalizedCurrent, true);
            }
            syncedDeliveries++;
          }
        } catch (err) {
          logger.error({ err: err.message, batchIndex: i }, '[DeliverySyncWorker] Failed to sync delivery batch');
        }
      }
      
      logger.info(`[DeliverySyncWorker] Completed delivery sync job. Synced ${syncedDeliveries} deliveries.`);
      return { syncedDeliveries };
    } catch (error) {
      logger.error({ err: error.message }, '[DeliverySyncWorker] Delivery sync job failed');
      throw error;
    }
  });

  // Add the repeatable job (runs every 30 minutes)
  deliverySyncQueue.add('sync-deliveries', {}, {
    repeat: { pattern: '*/30 * * * *' },
    jobId: 'repeat-delivery-sync'
  }).catch(err => logger.error({ err }, 'Failed to schedule delivery sync job'));

  logger.info('[DeliverySyncWorker] Worker initialized and repeatable job scheduled.');
};
