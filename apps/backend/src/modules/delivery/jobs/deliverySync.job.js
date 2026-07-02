import cron from 'node-cron';
import { deliveryRepository } from '../repositories/delivery.repository.js';
import { deliveryService } from '../services/delivery.service.js';
import { delhiveryService } from '../services/delhivery.service.js';
import { logger } from '../../../shared/services/logger.js';

export const initDeliverySyncJob = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Starting scheduled delivery sync job');

    try {
      const activeDeliveries = await deliveryRepository.findActiveDeliveries();
      
      for (const delivery of activeDeliveries) {
        if (!delivery.trackingNumber) continue;

        const trackingData = await delhiveryService.trackShipment(delivery.trackingNumber);
        
        if (trackingData && trackingData.status !== delivery.status) {
          const latestEvent = trackingData.events[trackingData.events.length - 1];
          await deliveryService.updateDeliveryStatus(
            delivery.id, 
            trackingData.status, 
            latestEvent?.location ? `At ${latestEvent.location}` : 'Status updated via sync'
          );
        }
      }
      
      logger.info(`Completed delivery sync job for ${activeDeliveries.length} active deliveries.`);
    } catch (error) {
      logger.error({ err: error.message }, 'Delivery sync job failed');
    }
  });
};
