import { deliveryRepository } from '../repositories/delivery.repository.js';
import { deliveryTrackingRepository } from '../repositories/deliveryTracking.repository.js';
import { delhiveryShipmentService } from './delhiveryShipmentService.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { notificationService } from '../../notifications/services/notification.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';

export const deliveryService = {
  async initiateDelivery(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        items: { include: { product: true, productVariant: true } },
        shop: { include: { seller: true } },
        address: true,
        delivery: true
      }
    });

    if (!order) throw new AppError('Order not found', 404);
    
    // Prevent duplicate shipment creation
    if (order.delivery && order.delivery.trackingNumber) {
      logger.info({ orderId }, 'Shipment already exists for order. Skipping duplicate creation.');
      return order.delivery;
    }

    const seller = order.shop?.seller;
    if (!seller || !seller.pickupLocationName) {
      throw new AppError('Seller pickup details are incomplete. Cannot automate shipment.', 400);
    }

    const deliveryAddress = order.address;

    try {
      // 1. Check for existing shipment (Recovery for Delhivery Success + DB Failure)
      let shipmentResponse = await delhiveryShipmentService.findShipmentByOrderNumber(order.orderNumber);
      
      if (shipmentResponse && shipmentResponse.trackingNumber) {
        logger.info({ orderId }, 'Recovered existing shipment from Delhivery.');
        shipmentResponse = { ...shipmentResponse, shipmentId: order.orderNumber, status: 'BOOKED' };
      } else {
        // Create new shipment
        shipmentResponse = await delhiveryShipmentService.createShipment(order, seller, deliveryAddress);
      }
      
      let pickupData = { pickupId: null, pickupDate: null, pickupTime: null };
      let shippingLabelUrl = null;

      // 2. Schedule Pickup
      if (shipmentResponse.success) {
        try {
          pickupData = await delhiveryShipmentService.createPickupRequest(seller, 1);
        } catch (pickupError) {
          logger.warn({ err: pickupError.message, orderId }, 'Automated pickup scheduling failed. Continuing with shipment.');
          pickupData = { pickupId: null, pickupDate: null, pickupTime: null };
        }
        
        // 3. Generate Shipping Label
        shippingLabelUrl = await delhiveryShipmentService.generateShippingLabel(shipmentResponse.trackingNumber);
      }

      // Save Delivery Record
      return prisma.$transaction(async (tx) => {
        const delivery = await tx.delivery.upsert({
          where: { orderId: order.id },
          update: {
            trackingNumber: shipmentResponse.trackingNumber,
            delhiveryShipmentId: shipmentResponse.shipmentId,
            status: 'CREATED',
            pickupRequestId: pickupData.pickupId,
            pickupDate: pickupData.pickupDate,
            pickupSlot: pickupData.pickupTime,
            shippingLabelUrl: shippingLabelUrl
          },
          create: {
            orderId: order.id,
            trackingNumber: shipmentResponse.trackingNumber,
            delhiveryShipmentId: shipmentResponse.shipmentId,
            status: 'CREATED',
            pickupRequestId: pickupData.pickupId,
            pickupDate: pickupData.pickupDate,
            pickupSlot: pickupData.pickupTime,
            shippingLabelUrl: shippingLabelUrl
          }
        });

        await tx.deliveryTrackingEvent.create({
          data: {
            deliveryId: delivery.id,
            status: 'CREATED',
            description: 'Shipment created and pickup scheduled',
          }
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            shipmentCreated: true,
            shipmentCreatedAt: new Date(),
            awbNumber: shipmentResponse.trackingNumber,
            delhiveryShipmentId: shipmentResponse.shipmentId,
          }
        });

        logger.info({ orderId, trackingNumber: shipmentResponse.trackingNumber }, 'Automated Shipment Workflow Completed Successfully');
        return delivery;
      });
    } catch (error) {
      logger.error({ err: error.message, orderId }, 'Failed to initiate automated delivery');
      
      // Save FAILED state so seller can retry
      await prisma.delivery.upsert({
        where: { orderId },
        update: { status: 'FAILED' },
        create: { orderId, status: 'FAILED' }
      });

      throw new AppError(`Shipment automation failed: ${error.message}`, 500);
    }
  },

  async retryShipment(orderId, sellerId) {
    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: { order: { include: { shop: true } } }
    });
    
    if (!delivery || delivery.status !== 'FAILED') {
      throw new AppError('Only failed shipments can be retried', 400);
    }
    
    // Ensure the caller is the seller of this order
    const seller = await prisma.seller.findUnique({ where: { userId: sellerId } });
    if (!seller || delivery.order.shop.sellerId !== seller.id) throw new AppError('Unauthorized', 403);
    
    // Call initiateDelivery again, which handles checking Delhivery and DB update
    return this.initiateDelivery(orderId);
  },

  async retryPickup(orderId, sellerId) {
    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: { order: { include: { shop: { include: { seller: true } } } } }
    });
    
    if (!delivery || !delivery.trackingNumber) throw new AppError('Shipment must exist before retrying pickup', 400);
    if (delivery.pickupRequestId) throw new AppError('Pickup is already scheduled', 400);

    const sellerDb = await prisma.seller.findUnique({ where: { userId: sellerId } });
    if (!sellerDb || delivery.order.shop.sellerId !== sellerDb.id) throw new AppError('Unauthorized', 403);

    const pickupData = await delhiveryShipmentService.createPickupRequest(delivery.order.shop.seller, 1);
    
    await prisma.delivery.update({
      where: { orderId },
      data: {
        pickupRequestId: pickupData.pickupId,
        pickupDate: pickupData.pickupDate,
        pickupSlot: pickupData.pickupTime
      }
    });

    return { message: 'Pickup scheduled successfully', pickupData };
  },

  async retryLabel(orderId, sellerId) {
    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: { order: { include: { shop: true } } }
    });
    
    if (!delivery || !delivery.trackingNumber) throw new AppError('Shipment must exist before retrying label', 400);
    if (delivery.shippingLabelUrl) throw new AppError('Label is already generated', 400);

    const seller = await prisma.seller.findUnique({ where: { userId: sellerId } });
    if (!seller || delivery.order.shop.sellerId !== seller.id) throw new AppError('Unauthorized', 403);

    const shippingLabelUrl = await delhiveryShipmentService.generateShippingLabel(delivery.trackingNumber);
    
    await prisma.delivery.update({
      where: { orderId },
      data: { shippingLabelUrl }
    });

    return { message: 'Label generated successfully', shippingLabelUrl };
  },

  async handleWebhookEvent(payload) {
    // Determine exact payload structure from Delhivery (usually Status.Status or awb/Status)
    const trackingNumber = payload.awb || payload.Waybill || (payload.Shipment && payload.Shipment.AWB);
    if (!trackingNumber) return;

    const delivery = await prisma.delivery.findUnique({
      where: { trackingNumber },
      include: { order: true }
    });
    
    if (!delivery) {
      logger.warn({ trackingNumber }, 'Webhook received for unknown tracking number');
      return;
    }

    const rawStatus = payload.status || payload.Status?.Status || payload.Status?.StatusType || '';
    const description = payload.instructions || payload.Status?.Instructions || payload.Status?.StatusLocation || rawStatus;
    
    // Map Delhivery Webhook Status to DeliveryStatus enum
    const statusMap = {
      'Manifested': 'CREATED',
      'In Transit': 'IN_TRANSIT',
      'Pending': 'PENDING',
      'Dispatched': 'OUT_FOR_DELIVERY',
      'Out for Delivery': 'OUT_FOR_DELIVERY',
      'Delivered': 'DELIVERED',
      'RTO': 'RTO',
      'Returned': 'RETURNED',
      'Canceled': 'CANCELLED',
      'Cancelled': 'CANCELLED',
      'NDR': 'NDR',
      'Picked Up': 'PICKED_UP'
    };

    const newStatus = statusMap[rawStatus] || 'IN_TRANSIT';
    
    // Idempotency: skip if already in this status
    if (delivery.status === newStatus) return;

    // Strict Monotonic State Machine to prevent delayed/out-of-order webhooks from moving shipments backwards
    const STATUS_RANKS = {
      'PENDING': 0, 'NOT_CREATED': 0, 'CREATING': 0,
      'CREATED': 10, 'BOOKED': 10, 'PICKUP_SCHEDULED': 10, 'READY_FOR_PICKUP': 10,
      'PICKED_UP': 20,
      'IN_TRANSIT': 30,
      'OUT_FOR_DELIVERY': 40,
      'NDR': 50,
      'DELIVERED': 100, 'RTO': 100, 'RETURNED': 100, 'CANCELLED': 100, 'FAILED': 100
    };

    const currentRank = STATUS_RANKS[delivery.status] ?? -1;
    const newRank = STATUS_RANKS[newStatus] ?? -1;

    // Reject backward transitions
    if (newRank < currentRank) {
      // Exception: Allow NDR to transition back to OUT_FOR_DELIVERY or IN_TRANSIT for re-attempts
      const isReattempt = delivery.status === 'NDR' && ['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(newStatus);
      
      if (!isReattempt) {
        logger.warn({ trackingNumber, oldStatus: delivery.status, newStatus }, 'Ignored out-of-order backward webhook transition');
        return;
      }
    }

    await this.updateDeliveryStatus(delivery.id, newStatus, description);
  },

  async updateDeliveryStatus(deliveryId, status, description = '') {
    return prisma.$transaction(async (tx) => {
      // Find delivery to get order ID
      const currentDelivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true }
      });
      if (!currentDelivery) return;

      const updateData = { status };
      
      // Update timestamps based on status
      if (status === 'PICKED_UP') updateData.pickedUpAt = new Date();
      if (status === 'IN_TRANSIT' && !currentDelivery.shippedAt) updateData.shippedAt = new Date();
      if (status === 'OUT_FOR_DELIVERY') updateData.outForDeliveryAt = new Date();
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
        updateData.deliveryVerifiedAt = new Date(); // Native OTP sets this via webhook
      }

      const delivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: updateData
      });
      
      await tx.deliveryTrackingEvent.create({
        data: {
          deliveryId,
          status,
          description
        }
      });

      // Sync Order Status automatically
      const orderStatusMap = {
        'CREATED': 'PROCESSING',
        'PICKUP_SCHEDULED': 'PROCESSING',
        'READY_FOR_PICKUP': 'PROCESSING',
        'PICKED_UP': 'SHIPPED',
        'IN_TRANSIT': 'SHIPPED',
        'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
        'DELIVERED': 'DELIVERED',
        'RTO': 'RTO',
        'NDR': 'SHIPPED', // NDR usually means it's still being attempted
        'RETURNED': 'RETURNED',
        'CANCELLED': 'CANCELLED'
      };

      const newOrderStatus = orderStatusMap[status];

      if (newOrderStatus && currentDelivery.order.status !== newOrderStatus) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: newOrderStatus }
        });

        // Trigger notification
        if (newOrderStatus === 'SHIPPED' || newOrderStatus === 'OUT_FOR_DELIVERY' || newOrderStatus === 'DELIVERED') {
          notificationService.createAndEmit(
            currentDelivery.order.customerId,
            'ORDER_STATUS_UPDATED',
            'Order Status Update 📦',
            `Your order #${currentDelivery.order.orderNumber} is now ${newOrderStatus.replace(/_/g, ' ')}.`,
            { orderId: delivery.orderId, status: newOrderStatus }
          ).catch(() => {});

          notificationService.createAndEmit(
            currentDelivery.order.shop?.seller?.userId,
            'ORDER_STATUS_UPDATED',
            'Logistics Update',
            `Order #${currentDelivery.order.orderNumber} logistics status: ${status}`,
            { orderId: delivery.orderId, status: newOrderStatus }
          ).catch(() => {});
        }
      }

      logger.info({ deliveryId, status, newOrderStatus }, 'Automated delivery & order status updated');
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
