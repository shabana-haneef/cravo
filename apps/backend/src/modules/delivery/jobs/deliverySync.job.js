import cron from 'node-cron';
import { deliveryRepository } from '../repositories/delivery.repository.js';
import { deliveryService } from '../services/delivery.service.js';
import { delhiveryService } from '../services/delhivery.service.js';
import { deliverySettingsService } from '../../admin/services/deliverySettings.service.js';
import { delhiveryShipmentService } from '../../../services/delhiveryShipmentService.js';
import prisma from '../../../lib/prisma.js';
import { logger } from '../../../shared/services/logger.js';

export const initDeliverySyncJob = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      const settings = await deliverySettingsService.get();
      if (!settings.autoSyncTracking) {
        logger.info('Delivery tracking sync is disabled via settings.');
        return;
      }

      logger.info('Starting scheduled delivery sync job');
      
      // 1. Sync Delivery Table Records
      const activeDeliveries = await deliveryRepository.findActiveDeliveries();
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
        } catch (err) {
          logger.error({ err: err.message, trackingNumber: delivery.trackingNumber }, 'Failed to sync delivery record');
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

            for (const ev of trackingData.events) {
              const eventExists = currentLogs.some(log => 
                log.event === ev.status && 
                log.location === ev.location && 
                log.timestamp === ev.date
              );
              if (!eventExists) {
                updatedLogs.push({
                  timestamp: ev.date || new Date().toISOString(),
                  event: ev.status,
                  location: ev.location,
                  remarks: 'Scanned at location'
                });
                logsUpdated = true;
              }
            }

            if (statusChanged || logsUpdated) {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  status: orderStatus,
                  trackingStatus,
                  shipmentLogs: updatedLogs
                }
              });
              logger.info({ orderNumber: order.orderNumber, orderStatus, trackingStatus }, 'Synced order tracking status successfully');
            }
          }
        } catch (err) {
          logger.error({ err: err.message, orderNumber: order.orderNumber }, 'Failed to sync order tracking status');
        }
      }
      
      logger.info(`Completed delivery sync job for ${activeDeliveries.length} deliveries and ${activeOrders.length} orders.`);
    } catch (error) {
      logger.error({ err: error.message }, 'Delivery sync job failed');
    }
  });
};
