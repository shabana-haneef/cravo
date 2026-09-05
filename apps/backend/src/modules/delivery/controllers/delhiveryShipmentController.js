import { deliveryService } from '../services/delivery.service.js';
import prisma from '../../../lib/prisma.js';
import { logger } from '../../../shared/services/logger.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const delhiveryShipmentController = {
  async createShipment(req, res, next) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        throw new AppError('Order ID parameter is required', 400);
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payments: true,
          shop: { include: { seller: true } }
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Security check: Only the seller who owns the order's shop, or an ADMIN, can create shipments
      const orderSeller = order.shop?.seller;
      if (req.user.role === 'SELLER') {
        if (!orderSeller || orderSeller.userId !== req.user.id) {
          throw new AppError('Unauthorized: Sellers can only create shipments for their own orders.', 403);
        }
      } else if (req.user.role !== 'ADMIN') {
        throw new AppError('Unauthorized: Only sellers or administrators can create shipments.', 403);
      }

      // Validate Order Status (must be CONFIRMED/seller_accepted)
      if (order.status !== 'CONFIRMED') {
        throw new AppError(`Shipment creation blocked: Order status must be CONFIRMED. Current status: ${order.status}`, 400);
      }

      // Payment verification check for prepaid orders
      const isPrepaid = order.payments && order.payments.length > 0;
      if (isPrepaid) {
        const isVerified = order.payments.some(p => p.status === 'SUCCESS');
        if (!isVerified) {
          throw new AppError('Shipment creation blocked: Prepaid order payment is not verified.', 400);
        }
      }

      // Delegate to the core service which implements atomic claims and full validation
      logger.info({ orderId }, 'Delegating to deliveryService.initiateDelivery');
      const delivery = await deliveryService.initiateDelivery(orderId);

      return res.status(200).json({
        success: true,
        message: 'Shipment created successfully',
        awbNumber: delivery.trackingNumber,
        delhiveryShipmentId: delivery.delhiveryShipmentId
      });

    } catch (error) {
      logger.error({ err: error.message, orderId: req.params.orderId }, 'Error in Delhivery shipment controller');
      
      // Update order logs if orderId exists
      try {
        const { orderId } = req.params;
        if (orderId) {
          const order = await prisma.order.findUnique({ where: { id: orderId } });
          if (order) {
            const currentLogs = Array.isArray(order.shipmentLogs) ? order.shipmentLogs : [];
            const errorLogEntry = {
              timestamp: new Date().toISOString(),
              event: 'Shipment Creation Failed',
              error: error.message || 'Unknown Error'
            };
            const updatedLogs = [...currentLogs, errorLogEntry];
            
            await prisma.$transaction(async (tx) => {
              await tx.orderShipmentLog.create({
                data: {
                  orderId,
                  event: errorLogEntry.event,
                  timestamp: new Date(errorLogEntry.timestamp),
                  error: errorLogEntry.error
                }
              });
              
              await tx.order.update({
                where: { id: orderId },
                data: { shipmentLogs: updatedLogs }
              });
            });
          }
        }
      } catch (logErr) {
        logger.error({ err: logErr.message }, 'Failed to record error logs in order');
      }

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'An error occurred while creating shipment.'
      });
    }
  }
};
