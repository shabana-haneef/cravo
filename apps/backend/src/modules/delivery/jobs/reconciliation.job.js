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
    logger.info('[ReconciliationWorker] Running Delivery Reconciliation Job');
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

      for (const delivery of activeDeliveries) {
        try {
          const delhiveryData = await delhiveryShipmentService.trackShipment(delivery.trackingNumber);
          
          if (delhiveryData && delhiveryData.status) {
            // Re-use webhook event handler to enforce strict state machine rules
            await deliveryService.handleWebhookEvent({
              awb: delivery.trackingNumber,
              status: delhiveryData.status,
              instructions: 'Updated via Reconciliation Job'
            });
          }
        } catch (err) {
          logger.warn({ err: err.message, deliveryId: delivery.id }, 'Failed to reconcile shipment');
        }
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
