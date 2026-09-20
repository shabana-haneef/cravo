import prisma from '../../../lib/prisma.js';
import { logger } from '../../../shared/services/logger.js';
import { delhiveryShipmentService } from '../services/delhiveryShipmentService.js';
import { deliveryService } from '../services/delivery.service.js';
import { createQueue, createWorker } from '../../../shared/utils/queue.manager.js';

export const reconciliationQueue = createQueue('reconciliation');

/**
 * Reconciliation Job
 * Runs every hour to sync pending/active shipments with Delhivery
 * Prevents missing webhooks from causing stuck shipments.
 */
export const startReconciliationJob = () => {
  createWorker('reconciliation', async (job) => {
    const jobName = job?.name || 'reconcile-deliveries';
    const jobData = job?.data || {};
    logger.info({ jobName, jobId: job?.id }, '[ReconciliationWorker] Processing reconciliation job');

    // 1. Dedicated E-Waybill reconciliation
    if (jobName === 'reconcile-ewaybill') {
      const { deliveryId, waybill, dcn, ewbn, flow, reason } = jobData;
      logger.info({ deliveryId, waybill, dcn, ewbn, flow, reason }, '[ReconciliationWorker] Processing reconcile-ewaybill');
      try {
        if (reason === 'POST_DELHIVERY_DB_SYNC_FAILED' && deliveryId && ewbn) {
          const updateData = (flow === 'RETURN')
            ? { returnEwaybillNumber: ewbn, updatedAt: new Date() }
            : { ewaybillNumber: ewbn, updatedAt: new Date() };

          await prisma.delivery.update({
            where: { id: deliveryId },
            data: updateData
          });

          await prisma.integrationLog.create({
            data: {
              id: `reconcile-ewb-resolved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              service: 'Delhivery',
              event: 'RECONCILIATION_EWAYBILL_SYNCED',
              status: 'RESOLVED',
              timestamp: new Date()
            }
          }).catch(() => {});
          logger.info({ deliveryId, ewbn }, '[ReconciliationWorker] Successfully reconciled e-waybill local state');
        }
      } catch (ewbErr) {
        logger.error({ err: ewbErr.message, deliveryId }, '[ReconciliationWorker] Failed to reconcile e-waybill');
      }
      return;
    }

    // 2. Cancelled shipment reconciliation
    if (jobName === 'reconcile-cancelled-shipment') {
      logger.info({ data: jobData }, '[ReconciliationWorker] Processing reconcile-cancelled-shipment');
      return;
    }

    // 3. Edited shipment reconciliation
    if (jobName === 'reconcile-edited-shipment') {
      logger.info({ data: jobData }, '[ReconciliationWorker] Processing reconcile-edited-shipment');
      return;
    }

    // 4. Pickup reconciliation
    if (jobName === 'reconcile-pickup') {
      logger.info({ data: jobData }, '[ReconciliationWorker] Processing reconcile-pickup');
      return;
    }

    // 5. Default: Periodic Active Deliveries Sync (reconcile-deliveries)
    try {
      // Fetch active deliveries that might have missed webhooks
      const activeDeliveries = await prisma.delivery.findMany({
        where: {
          status: {
            in: ['CREATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NDR']
          },
          trackingNumber: { not: null },
          updatedAt: {
            // Only reconcile shipments that haven't been updated in the last 4 hours
            lt: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        },
        take: 50 // Batch limit to prevent rate limits
      });

      if (activeDeliveries.length === 0) {
        return;
      }

      logger.info(`Reconciling ${activeDeliveries.length} active shipments`);

      const waybills = activeDeliveries.map(d => d.trackingNumber);

      try {
        const results = await delhiveryShipmentService.trackShipment(waybills);
        if (!results) return;

        const resultsArray = Array.isArray(results) ? results : [results];

        for (const delivery of activeDeliveries) {
          const trackingData = resultsArray.find(r => String(r.awb) === String(delivery.trackingNumber));
          if (!trackingData) continue;

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
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Failed to batch reconcile shipments');
      }
    } catch (error) {
      logger.error({ err: error.message }, '[ReconciliationWorker] Delivery Reconciliation Job failed');
    }
  });

  reconciliationQueue.add('reconcile-deliveries', {}, {
    repeat: { pattern: '0 * * * *' },
    jobId: 'repeat-reconcile-deliveries'
  }).catch(err => logger.error({ err }, 'Failed to schedule reconciliation job'));

  logger.info('[ReconciliationWorker] Worker initialized and repeatable job scheduled.');
};
