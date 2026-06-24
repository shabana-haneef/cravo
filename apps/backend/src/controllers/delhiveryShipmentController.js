import { delhiveryShipmentService } from '../services/delhiveryShipmentService.js';
import prisma from '../lib/prisma.js';
import { logger } from '../shared/services/logger.js';
import { AppError } from '../shared/errors/AppError.js';

export const delhiveryShipmentController = {
  async createShipment(req, res, next) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        throw new AppError('Order ID parameter is required', 400);
      }

      // Fetch order with all necessary inclusions
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payments: true,
          items: {
            include: {
              product: true
            }
          },
          shop: {
            include: {
              seller: true
            }
          },
          address: true
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

      // 1. Idempotency Check: Prevent duplicate shipment creation
      if (order.shipmentCreated) {
        return res.status(200).json({
          success: true,
          message: 'Shipment already created for this order',
          awbNumber: order.awbNumber,
          delhiveryShipmentId: order.delhiveryShipmentId
        });
      }

      // 2. Validate Order Status (must be CONFIRMED/seller_accepted)
      if (order.status !== 'CONFIRMED') {
        throw new AppError(`Shipment creation blocked: Order status must be CONFIRMED. Current status: ${order.status}`, 400);
      }

      // 3. Payment verification check for prepaid orders
      const isPrepaid = order.payments && order.payments.length > 0;
      if (isPrepaid) {
        const isVerified = order.payments.some(p => p.status === 'SUCCESS');
        if (!isVerified) {
          throw new AppError('Shipment creation blocked: Prepaid order payment is not verified.', 400);
        }
      }

      // 4. Validate Seller and Seller Pickup Details
      const seller = order.shop?.seller;
      if (!seller) {
        throw new AppError('Shipment creation blocked: Seller profile not found for this order.', 400);
      }

      const requiredPickupFields = [
        'pickupLocationName',
        'pickupAddress',
        'pickupCity',
        'pickupState',
        'pickupPincode',
        'pickupPhone'
      ];
      const missingPickupFields = requiredPickupFields.filter(field => !seller[field]?.trim());
      if (missingPickupFields.length > 0) {
        throw new AppError(`Shipment creation blocked: Missing seller pickup profile fields: ${missingPickupFields.join(', ')}`, 400);
      }

      // 5. Validate Customer shipping address details
      const deliveryAddress = order.address;
      if (!deliveryAddress) {
        throw new AppError('Shipment creation blocked: Customer delivery address not found.', 400);
      }

      const requiredDeliveryFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
      const missingDeliveryFields = requiredDeliveryFields.filter(field => !deliveryAddress[field]?.trim());
      if (missingDeliveryFields.length > 0) {
        throw new AppError(`Shipment creation blocked: Missing customer address fields: ${missingDeliveryFields.join(', ')}`, 400);
      }

      // 6. Call Delhivery shipment creation service
      logger.info({ orderId, orderNumber: order.orderNumber }, 'Initiating Delhivery shipment creation.');
      const result = await delhiveryShipmentService.createShipment(order, seller, deliveryAddress);

      // 7. Update order model inside a transaction
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Append log to shipmentLogs
        const currentLogs = Array.isArray(order.shipmentLogs) ? order.shipmentLogs : [];
        const newLogEntry = {
          timestamp: new Date().toISOString(),
          event: 'Shipment Created',
          awbNumber: result.trackingNumber,
          shipmentId: result.shipmentId,
          remarks: result.remarks
        };
        const updatedLogs = [...currentLogs, newLogEntry];

        return tx.order.update({
          where: { id: orderId },
          data: {
            shipmentCreated: true,
            shipmentCreatedAt: new Date(),
            awbNumber: result.trackingNumber,
            delhiveryShipmentId: result.shipmentId,
            trackingStatus: result.status.toLowerCase(),
            shipmentLogs: updatedLogs
          }
        });
      });

      logger.info({ orderId, awbNumber: result.trackingNumber }, 'Shipment registered successfully in database.');

      return res.status(200).json({
        success: true,
        message: 'Shipment created successfully',
        awbNumber: result.trackingNumber
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
            await prisma.order.update({
              where: { id: orderId },
              data: { shipmentLogs: updatedLogs }
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
