import { deliveryRepository } from '../repositories/delivery.repository.js';
import { deliveryTrackingRepository } from '../repositories/deliveryTracking.repository.js';
import { delhiveryService } from './delhivery.service.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';

export const deliveryService = {
  async initiateDelivery(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    
    // We need shop address (pickup) and customer address (delivery)
    const shop = order.shop; // Assuming we have seller profile/address. For now we mock pickup address.
    const pickupAddress = {
      fullName: shop.name,
      addressLine1: 'Shop Location',
      city: 'Local City',
      state: 'Kerala',
      postalCode: '682001',
      phone: '9876543210'
    };

    const deliveryAddress = order.address;

    // Call Delhivery API
    const shipmentResponse = await delhiveryService.createShipment(order, pickupAddress, deliveryAddress);

    // Save Delivery Record
    return prisma.$transaction(async (tx) => {
      const delivery = await deliveryRepository.create({
        orderId: order.id,
        trackingNumber: shipmentResponse.trackingNumber,
        delhiveryShipmentId: shipmentResponse.shipmentId,
        status: shipmentResponse.status,
      }, tx);

      await deliveryTrackingRepository.createEvent({
        deliveryId: delivery.id,
        status: shipmentResponse.status,
        description: 'Shipment booked via Delhivery',
      }, tx);

      logger.info({ orderId, trackingNumber: shipmentResponse.trackingNumber }, 'Shipment booked');
      return delivery;
    });
  },

  async handleWebhookEvent(payload) {
    // payload usually contains awb/waybill
    const waybill = payload.awb;
    const delivery = await deliveryRepository.findByTrackingNumber(waybill);
    if (!delivery) return;

    // Map Delhivery webhook status to our enum
    // Implementation varies based on Delhivery exact webhook format
    // Simplified version:
    const newStatus = payload.status; 
    await this.updateDeliveryStatus(delivery.id, newStatus, payload.instructions);
  },

  async updateDeliveryStatus(deliveryId, status, description = '') {
    return prisma.$transaction(async (tx) => {
      const delivery = await deliveryRepository.update(deliveryId, { status }, tx);
      
      await deliveryTrackingRepository.createEvent({
        deliveryId,
        status,
        description
      }, tx);

      // Sync Order Status
      if (status === 'DELIVERED') {
        await orderRepository.updateStatus(delivery.orderId, 'DELIVERED', tx);
        // Deduct inventory (already handled in order.service manually before, 
        // but now we could centralize it here)
      } else if (status === 'RETURNED' || status === 'FAILED') {
        // Handle failed deliveries
      }

      logger.info({ deliveryId, status }, 'Delivery status updated');
      return delivery;
    });
  },

  async getTracking(orderId) {
    const delivery = await deliveryRepository.findByOrderId(orderId);
    if (!delivery) throw new AppError('Delivery not found for this order', 404);

    return delivery;
  },

  async cancelDelivery(orderId) {
    const delivery = await deliveryRepository.findByOrderId(orderId);
    if (!delivery || !delivery.trackingNumber) return;

    const success = await delhiveryService.cancelShipment(delivery.trackingNumber);
    if (success) {
      await this.updateDeliveryStatus(delivery.id, 'CANCELLED', 'Cancelled by seller/system');
    }
  }
};
