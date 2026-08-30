import { orderRepository } from '../repositories/order.repository.js';
import { shopRepository } from '../../shops/repositories/shop.repository.js';
import { sellerRepository } from '../../sellers/repositories/seller.repository.js';
import { deliveryService } from '../../delivery/services/delivery.service.js';
import { notificationService } from '../../notifications/services/notification.service.js';
import { orderSettingsService } from '../../admin/services/orderSettings.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import prisma from '../../../lib/prisma.js';
import { logger } from '../../../shared/services/logger.js';


export const orderService = {
  async getMyOrders(userId, page = 1, limit = 20) {
    return orderRepository.findCustomerOrders(userId, page, limit);
  },

  async getOrderById(userId, orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    // IDOR protection
    if (order.customerId !== userId) {
      // Check if caller is the seller of the order
      const seller = await sellerRepository.findByUserId(userId);
      if (!seller) throw new AppError("Unauthorized access", 403);
      const shop = await shopRepository.findBySellerId(seller.id);
      if (!shop || order.shopId !== shop.id) throw new AppError("Unauthorized access", 403);
    }

    return order;
  },

  async getSellerOrders(userId, page = 1, limit = 20) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    
    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

    return orderRepository.findSellerOrders(shop.id, page, limit);
  },

  async cancelOrder(userId, orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);
    if (order.customerId !== userId) throw new AppError("Unauthorized", 403);

    const settings = await orderSettingsService.get();
    if (!settings.allowCustomerCancellation) {
      throw new AppError("Customer cancellation is disabled.", 400);
    }

    const minutesElapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
    if (minutesElapsed > settings.customerCancellationWindowMins) {
      throw new AppError(`Cancellation window of ${settings.customerCancellationWindowMins} minutes has expired.`, 400);
    }

    return prisma.$transaction(async (tx) => {
      // Atomic state transition prevents Double Cancellation race condition
      const updateResult = await tx.order.updateMany({
        where: { 
          id: orderId,
          status: { in: ['PENDING_PAYMENT', 'PLACED'] }
        },
        data: { status: 'CANCELLED' }
      });

      if (updateResult.count === 0) {
        throw new AppError("Order cannot be cancelled at this stage", 400);
      }

      // Release reserved stock using Atomic SQL Updates
      for (const item of order.items) {
        const inventoryBefore = await tx.inventory.findUnique({ where: { productVariantId: item.productVariantId } });
        if (!inventoryBefore) continue;

        const updateResult = await tx.inventory.updateMany({
          where: { 
            productVariantId: item.productVariantId,
            reservedStock: { gte: item.quantity }
          },
          data: {
            availableStock: { increment: item.quantity },
            reservedStock: { decrement: item.quantity }
          }
        });
        
        if (updateResult.count > 0) {
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventoryBefore.id,
              type: 'ORDER_RELEASED',
              quantity: item.quantity,
              previousStock: inventoryBefore.availableStock,
              newStock: inventoryBefore.availableStock + item.quantity,
              reason: 'Order cancelled by user',
              createdBy: userId
            }
          });
        }
      }

      logger.info({ userId, orderId }, 'Order cancelled by customer');

      // Notify seller that order was cancelled (fire-and-forget)
      if (order.shop?.seller?.userId) {
        notificationService.createAndEmit(
          order.shop.seller.userId,
          'ORDER_CANCELLED',
          'Order Cancelled',
          `Order #${order.orderNumber} has been cancelled by the customer.`,
          { orderId, orderNumber: order.orderNumber }
        ).catch(() => {});
      }

      return { message: "Order cancelled successfully" };
    });
  },

  async updateOrderStatus(userId, orderId, status) {
    // Only sellers can update status forward
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) throw new AppError("Unauthorized", 403);
    
    const shop = await shopRepository.findBySellerId(seller.id);
    const order = await orderRepository.findById(orderId);
    
    if (!order || order.shopId !== shop.id) throw new AppError("Order not found", 404);

    const settings = await orderSettingsService.get();
    const transitions = settings.allowedTransitions || {
      'PLACED': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PREPARING'],
      'PREPARING': ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
      'READY_FOR_PICKUP': ['DELIVERED'],
      'OUT_FOR_DELIVERY': ['DELIVERED']
    };

    const result = await prisma.$transaction(async (tx) => {
      const validSourceStatuses = Object.keys(transitions).filter(key => transitions[key].includes(status));
      
      // Atomic state transition prevents Double Status Update race condition
      const updateResult = await tx.order.updateMany({
        where: { 
          id: orderId,
          status: { in: validSourceStatuses }
        },
        data: { status }
      });

      if (updateResult.count === 0) {
        throw new AppError(`Cannot transition order to ${status} at this stage`, 400);
      }

      // If delivered, deduct stock from reserved (ORDER_COMPLETED) using Atomic SQL Updates
      if (status === 'DELIVERED') {
        for (const item of order.items) {
          const inventoryBefore = await tx.inventory.findUnique({ where: { productVariantId: item.productVariantId } });
          if (!inventoryBefore) continue;

          const updateResult = await tx.inventory.updateMany({
            where: { 
              productVariantId: item.productVariantId,
              reservedStock: { gte: item.quantity }
            },
            data: {
              reservedStock: { decrement: item.quantity }
            }
          });
          
          if (updateResult.count > 0) {
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inventoryBefore.id,
                type: 'ORDER_COMPLETED',
                quantity: item.quantity,
                previousStock: inventoryBefore.availableStock,
                newStock: inventoryBefore.availableStock,
                reason: 'Order delivered',
                createdBy: userId
              }
            });
          }
        }
      }

      logger.info({ userId, orderId, status }, 'Order status updated by seller');
      return { message: "Order status updated" };
    });
    
    // Notify customer about status change (fire-and-forget)
    notificationService.createAndEmit(
      order.customerId,
      'ORDER_STATUS_UPDATED',
      'Order Update 📦',
      `Your order #${order.orderNumber} status is now: ${status.replace(/_/g, ' ')}.`,
      { orderId, orderNumber: order.orderNumber, status }
    ).catch(() => {});

    // Outside transaction, trigger delivery if confirmed
    if (status === 'CONFIRMED') {
      // Execute asynchronously, don't wait or block response
      deliveryService.initiateDelivery(orderId).catch(err => {
        logger.error({ err: err.message, orderId }, 'Failed to initiate delivery on CONFIRM');
      });
    }

    return result;
  }
};
