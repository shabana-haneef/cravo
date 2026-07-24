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
      
      // 1. Sync Delivery Table Records
      const activeDeliveries = await deliveryRepository.findActiveDeliveries();
      let syncedDeliveries = 0;
      for (const delivery of activeDeliveries) {
        if (!delivery.trackingNumber) continue;
        try {
          const trackingData = await delhiveryService.trackShipment(delivery.trackingNumber);
          if (trackingData && trackingData.status !== delivery.status) {
            const latestEvent = trackingData.events[trackingData.events.length - 1];
            await deliveryService.updateDeliveryStatus(
              delivery.id, 
              trackingData.status, 
              latestEvent?.location ? `At ${latestEvent.location}` : 'Status updated via sync'
            );
          }
          syncedDeliveries++;
        } catch (err) {
          logger.error({ err: err.message, trackingNumber: delivery.trackingNumber }, '[DeliverySyncWorker] Failed to sync delivery record');
        }
      }

      // 2. Sync Order Table Delhivery Shipments (Marketplace Integration)
      const activeOrders = await prisma.order.findMany({
        where: {
          shipmentCreated: true,
          status: {
            notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED']
          }
        }
      });

      let syncedOrders = 0;
      for (const order of activeOrders) {
        if (!order.awbNumber) continue;
        try {
          const trackingData = await delhiveryShipmentService.trackShipment(order.awbNumber);
          if (trackingData) {
            let statusChanged = false;
            let orderStatus = order.status;
            let trackingStatus = order.trackingStatus;

            // Map tracking status to Order Status
            if (trackingData.status === 'DELIVERED' && order.status !== 'DELIVERED') {
              orderStatus = 'DELIVERED';
              trackingStatus = 'delivered';
              statusChanged = true;
            } else if (trackingData.status === 'OUT_FOR_DELIVERY' && order.status !== 'OUT_FOR_DELIVERY') {
              orderStatus = 'OUT_FOR_DELIVERY';
              trackingStatus = 'out_for_delivery';
              statusChanged = true;
            } else if (trackingData.status === 'CANCELLED' && order.status !== 'CANCELLED') {
              orderStatus = 'CANCELLED';
              trackingStatus = 'cancelled';
              statusChanged = true;
            } else if (trackingData.status === 'RETURNED' && order.status !== 'CANCELLED') {
              orderStatus = 'CANCELLED'; // RTO cancels the order in our simplified MERN state
              trackingStatus = 'returned';
              statusChanged = true;
            } else if (trackingData.status.toLowerCase() !== order.trackingStatus.toLowerCase()) {
              trackingStatus = trackingData.status.toLowerCase();
              statusChanged = true;
            }

            // Append scanned events that aren't already in shipmentLogs
            const currentLogs = Array.isArray(order.shipmentLogs) ? order.shipmentLogs : [];
            let logsUpdated = false;
            const updatedLogs = [...currentLogs];
            const newLogsToRelational = [];

            for (const ev of trackingData.events) {
              const eventExists = currentLogs.some(log => 
                log.event === ev.status && 
                log.location === ev.location && 
                log.timestamp === ev.date
              );
              if (!eventExists) {
                const newLog = {
                  timestamp: ev.date || new Date().toISOString(),
                  event: ev.status,
                  location: ev.location,
                  remarks: 'Scanned at location'
                };
                updatedLogs.push(newLog);
                newLogsToRelational.push(newLog);
                logsUpdated = true;
              }
            }

            if (statusChanged || logsUpdated) {
              await prisma.$transaction(async (tx) => {
                if (newLogsToRelational.length > 0) {
                  await tx.orderShipmentLog.createMany({
                    data: newLogsToRelational.map(log => ({
                      orderId: order.id,
                      event: log.event,
                      timestamp: new Date(log.timestamp),
                      remarks: log.remarks || null
                    }))
                  });
                }
                
                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    status: orderStatus,
                    trackingStatus,
                    shipmentLogs: updatedLogs
                  }
                });
              });
              logger.info({ orderNumber: order.orderNumber, orderStatus, trackingStatus }, '[DeliverySyncWorker] Synced order tracking status successfully');
            }
          }
          syncedOrders++;
        } catch (err) {
          logger.error({ err: err.message, orderNumber: order.orderNumber }, '[DeliverySyncWorker] Failed to sync order tracking status');
        }
      }
      
      logger.info(`[DeliverySyncWorker] Completed delivery sync job for ${syncedDeliveries} deliveries and ${syncedOrders} orders.`);
      return { syncedDeliveries, syncedOrders };
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
