import { deliveryRepository } from '../repositories/delivery.repository.js';
import { deliveryTrackingRepository } from '../repositories/deliveryTracking.repository.js';
import { delhiveryShipmentService } from './delhiveryShipmentService.js';
import { delhiveryService } from './delhiveryService.js';
import { waybillInventoryService } from './waybillInventory.service.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { notificationService } from '../../notifications/services/notification.service.js';
import { refundService } from '../../payments/services/refund.service.js';
import { orderSettingsService } from '../../admin/services/orderSettings.service.js';
import { redis } from '../../../config/redis.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';
import { createHash } from 'crypto';

// Distributed (Redis) and in-memory concurrency locks for operations per delivery
const activeDeliveryLocks = new Set();

export const acquireDeliveryLock = async (deliveryId, operation = 'delivery', ttlSeconds = 30) => {
  const lockKey = `lock:delivery:${operation}:${deliveryId}`;
  const localKey = `${operation}:${deliveryId}`;
  const friendlyOp = operation === 'ewaybill' ? 'e-waybill update' : (operation === 'pickup' ? 'pickup' : 'delivery');

  // 1. Distributed lock via Redis across multiple backend instances
  if (redis && redis.isOpen && typeof redis.set === 'function') {
    try {
      const acquired = await redis.set(lockKey, 'LOCKED', { NX: true, EX: ttlSeconds });
      if (!acquired) {
        throw new AppError(`Another ${friendlyOp} operation is currently in progress for this shipment. Please wait.`, 409, 'CONCURRENT_OPERATION');
      }
      activeDeliveryLocks.add(localKey);
      return async () => {
        activeDeliveryLocks.delete(localKey);
        try {
          await redis.del(lockKey);
        } catch (_) {}
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn({ err: err.message, deliveryId, operation }, `Redis ${operation} lock attempt failed, falling back to process-local lock`);
    }
  }

  // 2. Process-local fallback lock
  if (activeDeliveryLocks.has(localKey)) {
    throw new AppError(`Another ${friendlyOp} operation is currently in progress for this shipment. Please wait.`, 409, 'CONCURRENT_OPERATION');
  }
  activeDeliveryLocks.add(localKey);
  return async () => {
    activeDeliveryLocks.delete(localKey);
  };
};

const acquirePickupLock = (deliveryId, ttlSeconds = 30) => acquireDeliveryLock(deliveryId, 'pickup', ttlSeconds);


export const deliveryService = {
  async initiateDelivery(orderId) {
    // 1. Atomic Claim Transaction
    const claim = await prisma.$transaction(async (tx) => {
      const existingDelivery = await tx.delivery.findFirst({ where: { orderId } });
      
      if (existingDelivery) {
        if (existingDelivery.trackingNumber) {
          return { status: 'ALREADY_CREATED', delivery: existingDelivery };
        }
        if (existingDelivery.status === 'CREATING') {
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          if (existingDelivery.updatedAt > twoMinutesAgo) {
            return { status: 'LOCKED' };
          }
          // It's stale. Allow re-claim.
        } else if (['CREATED', 'BOOKED', 'PICKUP_SCHEDULED'].includes(existingDelivery.status)) {
          return { status: 'ALREADY_CREATED', delivery: existingDelivery };
        }
      }

      // Atomically claim the delivery row
      const updated = await tx.delivery.upsert({
        where: { orderId },
        update: { status: 'CREATING', updatedAt: new Date() },
        create: { orderId, status: 'CREATING' }
      });
      return { status: 'CLAIMED', delivery: updated };
    });

    if (claim.status === 'LOCKED') {
      throw new AppError('Shipment is currently being processed. Please wait.', 409);
    }
    if (claim.status === 'ALREADY_CREATED') {
      logger.info({ orderId }, 'Shipment already exists for order. Skipping duplicate creation.');
      return claim.delivery;
    }

    // 2. Fetch full order for API
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

    const seller = order.shop?.seller;
    if (!seller || seller.delhiveryRegistrationStatus !== 'REGISTERED' || !seller.delhiveryPickupLocationId) {
      // Save FAILED state so seller can retry later when location is registered
      await prisma.delivery.upsert({
        where: { orderId },
        update: { status: 'FAILED' },
        create: { orderId, status: 'FAILED' }
      });
      throw new AppError('Shipment blocked: Seller pickup location is not registered with Delhivery.', 400);
    }

    const deliveryAddress = order.address;

    let reservedWaybill = null;
    try {
      // 1. Check for existing shipment (Recovery for Delhivery Success + DB Failure)
      let shipmentResponse = await delhiveryShipmentService.findShipmentByOrderNumber(order.orderNumber);
      
      if (shipmentResponse && shipmentResponse.trackingNumber) {
        logger.info({ orderId }, 'Recovered existing shipment from Delhivery.');
        shipmentResponse = { ...shipmentResponse, shipmentId: order.orderNumber, status: 'BOOKED' };
      } else {
        // Reserve an available waybill from persistent inventory if available
        try {
          reservedWaybill = await waybillInventoryService.reserveWaybill({
            orderId: order.id,
            reservedFor: `ORDER_${order.orderNumber}`
          });
          if (reservedWaybill) {
            logger.info({ orderId, waybill: reservedWaybill.waybill }, 'Reserved waybill from inventory for shipment');
          }
        } catch (resErr) {
          logger.warn({ err: resErr.message, orderId }, 'Waybill reservation skipped/failed, falling back to dynamic assignment');
        }

        // Create new shipment (supplying reserved waybill if present)
        shipmentResponse = await delhiveryShipmentService.createShipment(
          order,
          seller,
          deliveryAddress,
          reservedWaybill ? { waybill: reservedWaybill.waybill } : {}
        );
      }
      
      let pickupData = { pickupId: null, pickupDate: null, pickupTime: null };
      let shippingLabelUrl = null;

      // 2. Schedule Pickup
      if (shipmentResponse.success) {
        try {
          // Check for existing shared pickup first, explicitly matching the pickup location!
          const existingPickup = await prisma.delivery.findFirst({
            where: {
              order: { shop: { seller: { id: seller.id, pickupLocationName: seller.pickupLocationName } } },
              pickupRequestId: { not: null },
              status: { in: ['CREATED', 'PICKUP_SCHEDULED'] }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (existingPickup && existingPickup.pickupRequestId) {
            pickupData = {
              pickupId: existingPickup.pickupRequestId,
              pickupDate: existingPickup.pickupDate,
              pickupTime: existingPickup.pickupSlot
            };
          } else {
            pickupData = await delhiveryShipmentService.createPickupRequest(seller, 1);
          }
        } catch (pickupError) {
          logger.warn({ err: pickupError.message, orderId }, 'Automated pickup scheduling failed. Continuing with shipment.');
          pickupData = { pickupId: null, pickupDate: null, pickupTime: null };
        }
        
        // 3. Generate Shipping Label
        shippingLabelUrl = await delhiveryShipmentService.generateShippingLabel(shipmentResponse.trackingNumber);
      }

      // Save Delivery Record
      const deliveryRecord = await prisma.$transaction(async (tx) => {
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

        const formattedRemarks = (Array.isArray(shipmentResponse.remarks) ? shipmentResponse.remarks.join(' ') : shipmentResponse.remarks) || 'Shipment created and pickup scheduled';

        // Dual-Write to Relational Table
        await tx.orderShipmentLog.create({
          data: {
            orderId: order.id,
            event: 'Shipment Created',
            timestamp: new Date(),
            awbNumber: shipmentResponse.trackingNumber,
            shipmentId: shipmentResponse.shipmentId,
            remarks: formattedRemarks
          }
        });

        const currentLogs = Array.isArray(order.shipmentLogs) ? order.shipmentLogs : [];
        const newLogEntry = {
          timestamp: new Date().toISOString(),
          event: 'Shipment Created',
          awbNumber: shipmentResponse.trackingNumber,
          shipmentId: shipmentResponse.shipmentId,
          remarks: formattedRemarks
        };

        await tx.order.update({
          where: { id: order.id },
          data: {
            shipmentCreated: true,
            shipmentCreatedAt: new Date(),
            awbNumber: shipmentResponse.trackingNumber,
            delhiveryShipmentId: shipmentResponse.shipmentId,
            shipmentLogs: [...currentLogs, newLogEntry]
          }
        });

        return delivery;
      });

      // 4. Mark waybill as USED in inventory
      if (shipmentResponse.trackingNumber) {
        await waybillInventoryService.markWaybillUsed(shipmentResponse.trackingNumber, {
          orderId: order.id,
          deliveryId: deliveryRecord.id
        }).catch(err => logger.warn({ err: err.message }, 'Failed to update waybill status to USED'));
      }

      logger.info({ orderId, trackingNumber: shipmentResponse.trackingNumber }, 'Automated Shipment Workflow Completed Successfully');
      return deliveryRecord;
    } catch (error) {
      logger.error({ err: error.message, orderId }, 'Failed to initiate automated delivery');
      
      // If a waybill was reserved, handle failure recovery:
      if (reservedWaybill && reservedWaybill.waybill) {
        // Safe release only if error is confirmed client validation / pre-flight before Delhivery accepted it
        const isSafeClientError = error.statusCode === 400 && !error.message?.includes('timeout') && !error.message?.includes('ETIMEDOUT');
        if (isSafeClientError) {
          await waybillInventoryService.releaseWaybill(
            reservedWaybill.waybill,
            `PRE_DELHIVERY_FAILURE: ${error.message}`
          ).catch(e => logger.warn({ err: e.message }, 'Failed to release waybill'));
        } else {
          // Ambiguous / network failure: keep RESERVED to prevent duplicate allocation
          logger.warn({ waybill: reservedWaybill.waybill, orderId }, 'Waybill kept in RESERVED state due to ambiguous shipment creation failure');
        }
      }

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
    
    if (!delivery) {
      throw new AppError('Delivery record not found', 404);
    }

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const isStaleCreating = delivery.status === 'CREATING' && delivery.updatedAt < twoMinutesAgo;
    
    if (delivery.status !== 'FAILED' && !isStaleCreating) {
      throw new AppError('Only failed or stale shipments can be retried', 400);
    }
    
    // Ensure the caller is the seller of this order
    const seller = await prisma.seller.findUnique({ where: { userId: sellerId } });
    if (!seller || delivery.order.shop.sellerId !== seller.id) throw new AppError('Unauthorized', 403);
    
    // Call initiateDelivery again, which handles checking Delhivery and DB update
    return this.initiateDelivery(orderId);
  },

  /**
   * Cancels an active Delhivery pickup request
   * Reverts Delivery.status from PICKUP_SCHEDULED -> BOOKED
   */
  async cancelPickup(deliveryIdOrOrderId, actor = {}, options = {}) {
    if (!deliveryIdOrOrderId) {
      throw new AppError('Delivery ID or Order ID is required to cancel pickup', 400);
    }

    let delivery = null;
    if (prisma.delivery?.findFirst) {
      delivery = await prisma.delivery.findFirst({
        where: {
          OR: [
            { id: deliveryIdOrOrderId },
            { orderId: deliveryIdOrOrderId }
          ]
        },
        include: {
          order: {
            include: {
              shop: { include: { seller: true } }
            }
          }
        }
      });
    }
    if (!delivery && prisma.delivery?.findUnique) {
      delivery = await prisma.delivery.findUnique({
        where: { orderId: deliveryIdOrOrderId },
        include: {
          order: {
            include: {
              shop: { include: { seller: true } }
            }
          }
        }
      }).catch(() => null);
      if (!delivery) {
        delivery = await prisma.delivery.findUnique({
          where: { id: deliveryIdOrOrderId },
          include: {
            order: {
              include: {
                shop: { include: { seller: true } }
              }
            }
          }
        }).catch(() => null);
      }
    }

    if (!delivery) {
      throw new AppError('Delivery record not found', 404);
    }

    // 1. Authorization: ADMIN or owning SELLER
    const isAdmin = actor.role === 'ADMIN';
    const sellerUserId = delivery.order?.shop?.seller?.userId;
    const sellerId = delivery.order?.shop?.sellerId;
    const actorUserId = actor.userId || actor.id;
    const actorSellerId = actor.sellerId;
    const isOwner = (sellerUserId && sellerUserId === actorUserId) || (sellerId && sellerId === actorSellerId);

    if (!isAdmin && !isOwner) {
      throw new AppError('Unauthorized: You do not have permission to cancel pickup for this shipment', 403);
    }

    // 2. State Validations
    if (!delivery.trackingNumber) {
      throw new AppError('Cannot cancel pickup for a delivery without a valid shipment tracking number', 400);
    }

    const isPostDispatch = delivery.pickedUpAt || 
                           delivery.shippedAt || 
                           delivery.outForDeliveryAt || 
                           delivery.deliveredAt || 
                           ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'RTO'].includes(delivery.status);

    if (isPostDispatch) {
      throw new AppError('Pickup cannot be cancelled after courier pickup has already occurred', 400, 'SHIPMENT_IN_TRANSIT');
    }

    if (delivery.status === 'CANCELLED') {
      throw new AppError(`Cannot cancel pickup when delivery status is ${delivery.status}`, 400, 'INVALID_DELIVERY_STATUS');
    }

    if (!delivery.pickupRequestId) {
      throw new AppError('No active pickup request found to cancel for this shipment', 400, 'NO_ACTIVE_PICKUP');
    }

    // 3. Concurrency Protection (Distributed Redis + Process-Local)
    const releaseLock = await acquirePickupLock(delivery.id);

    try {
      // 4. Audit pickupRequestId Semantics (Check for Shared Pickups)
      const siblingDeliveries = await prisma.delivery.findMany({
        where: {
          pickupRequestId: delivery.pickupRequestId,
          id: { not: delivery.id }
        }
      });
      const isSharedPickup = siblingDeliveries.length > 0;

      // 5. Cancel with Delhivery if NOT shared
      const previousPickupId = delivery.pickupRequestId;
      const seller = delivery.order?.shop?.seller;

      if (!isSharedPickup) {
        try {
          await delhiveryShipmentService.cancelPickupRequest({
            pickupId: previousPickupId,
            pickupLocation: seller?.pickupLocationName
          });
        } catch (delhiveryError) {
          if (delhiveryError.isAmbiguous) {
            await prisma.integrationLog.create({
              data: {
                id: `pickup-cancel-timeout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                service: 'Delhivery',
                event: 'PICKUP_CANCEL_TIMEOUT',
                status: 'AMBIGUOUS_TIMEOUT',
                timestamp: new Date()
              }
            }).catch(() => {});
          }
          throw delhiveryError;
        }
      } else {
        logger.info(
          { pickupId: previousPickupId, deliveryId: delivery.id, siblingsCount: siblingDeliveries.length },
          'Shared pickup request detected. Disassociating delivery without cancelling Delhivery pickup request.'
        );
      }

      // 6. Update Database Transactionally
      await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            pickupRequestId: null,
            pickupDate: null,
            pickupSlot: null,
            status: 'BOOKED',
            updatedAt: new Date()
          }
        });

        const actorLabel = isAdmin ? 'ADMIN' : 'SELLER';
        const remarks = isSharedPickup
          ? `Disassociated shipment from shared pickup request #${previousPickupId} by ${actorLabel}. Courier pickup remains active for other shipments.`
          : `Courier pickup request #${previousPickupId} cancelled on Delhivery by ${actorLabel}. Delivery status reverted to BOOKED.`;

        await tx.orderShipmentLog.create({
          data: {
            orderId: delivery.orderId,
            event: 'Pickup Cancelled',
            timestamp: new Date(),
            awbNumber: delivery.trackingNumber,
            remarks
          }
        });

        const currentLogs = Array.isArray(delivery.order?.shipmentLogs) ? delivery.order.shipmentLogs : [];
        await tx.order.update({
          where: { id: delivery.orderId },
          data: {
            shipmentLogs: [
              ...currentLogs,
              {
                timestamp: new Date().toISOString(),
                event: 'Pickup Cancelled',
                awbNumber: delivery.trackingNumber,
                remarks
              }
            ]
          }
        });

        await tx.integrationLog.create({
          data: {
            id: `pickup-cancel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'PICKUP_CANCEL',
            status: 'SUCCESS',
            timestamp: new Date()
          }
        });
      });

      logger.info({ deliveryId: delivery.id, pickupId: previousPickupId }, 'Completed pickup cancellation');

      return {
        success: true,
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        trackingNumber: delivery.trackingNumber,
        deliveryStatus: 'BOOKED',
        pickupRequestId: null,
        pickupDate: null,
        pickupSlot: null
      };
    } finally {
      await releaseLock();
    }
  },

  /**
   * Schedules or Reschedules a Delhivery pickup request
   * Supports custom pickupDate (YYYY-MM-DD) and pickupTime (HH:MM:SS) or auto-assignment
   */
  async reschedulePickup(deliveryIdOrOrderId, actor = {}, { pickupDate, pickupTime, expectedPackageCount = 1 } = {}) {
    if (!deliveryIdOrOrderId) {
      throw new AppError('Delivery ID or Order ID is required to schedule/reschedule pickup', 400);
    }

    let delivery = null;
    if (prisma.delivery?.findFirst) {
      delivery = await prisma.delivery.findFirst({
        where: {
          OR: [
            { id: deliveryIdOrOrderId },
            { orderId: deliveryIdOrOrderId }
          ]
        },
        include: {
          order: {
            include: {
              shop: { include: { seller: true } }
            }
          }
        }
      });
    }
    if (!delivery && prisma.delivery?.findUnique) {
      delivery = await prisma.delivery.findUnique({
        where: { orderId: deliveryIdOrOrderId },
        include: {
          order: {
            include: {
              shop: { include: { seller: true } }
            }
          }
        }
      }).catch(() => null);
      if (!delivery) {
        delivery = await prisma.delivery.findUnique({
          where: { id: deliveryIdOrOrderId },
          include: {
            order: {
              include: {
                shop: { include: { seller: true } }
              }
            }
          }
        }).catch(() => null);
      }
    }

    if (!delivery) {
      throw new AppError('Delivery record not found', 404);
    }

    // 1. Authorization: ADMIN or owning SELLER
    const isAdmin = actor.role === 'ADMIN';
    const sellerUserId = delivery.order?.shop?.seller?.userId;
    const sellerId = delivery.order?.shop?.sellerId;
    const actorUserId = actor.userId || actor.id;
    const actorSellerId = actor.sellerId;
    const isOwner = (sellerUserId && sellerUserId === actorUserId) || (sellerId && sellerId === actorSellerId);

    if (!isAdmin && !isOwner) {
      throw new AppError('Unauthorized: You do not have permission to manage pickup for this shipment', 403);
    }

    // 2. State Validations
    if (!delivery.trackingNumber) {
      throw new AppError('Shipment must exist before scheduling or retrying pickup', 400);
    }

    const isPostDispatch = delivery.pickedUpAt || 
                           delivery.shippedAt || 
                           delivery.outForDeliveryAt || 
                           delivery.deliveredAt || 
                           ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'RTO'].includes(delivery.status);

    if (isPostDispatch) {
      throw new AppError(
        'Cannot reschedule pickup: This shipment has already been picked up from the warehouse or dispatched with the courier.',
        400,
        'POST_DISPATCH_FAILURE'
      );
    }

    if (delivery.status === 'CANCELLED') {
      throw new AppError(`Cannot reschedule pickup when delivery status is ${delivery.status}`, 400, 'INVALID_DELIVERY_STATUS');
    }

    // 3. Date & Time Validation (No invented slots, strictly documented formats)
    let validatedDate = null;
    let validatedTime = null;

    if (pickupDate) {
      const dateStr = String(pickupDate).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new AppError('Invalid pickupDate format. Must be YYYY-MM-DD.', 400, 'INVALID_DATE_FORMAT');
      }
      const targetDate = new Date(`${dateStr}T00:00:00Z`);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const maxFutureDate = new Date(today);
      maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

      if (targetDate < today) {
        throw new AppError('pickupDate cannot be in the past.', 400, 'DATE_IN_PAST');
      }
      if (targetDate > maxFutureDate) {
        throw new AppError('pickupDate cannot be scheduled more than 7 days in advance.', 400, 'DATE_TOO_FAR');
      }
      validatedDate = dateStr;
    }

    if (pickupTime) {
      const timeStr = String(pickupTime).trim();
      if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(timeStr)) {
        throw new AppError('Invalid pickupTime format. Must be HH:MM:SS or HH:MM.', 400, 'INVALID_TIME_FORMAT');
      }
      validatedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    }

    // 4. Concurrency Protection (Distributed Redis + Process-Local)
    const releaseLock = await acquirePickupLock(delivery.id);

    try {
      const seller = delivery.order?.shop?.seller;
      if (!seller || !seller.pickupLocationName) {
        throw new AppError('Seller pickup location is missing or not registered with Delhivery.', 400);
      }

      // 5. Handling Existing Active Pickup (Cancel Old Pickup First)
      let oldCancelled = false;
      const existingPickupId = delivery.pickupRequestId;

      if (existingPickupId) {
        const siblingDeliveries = await prisma.delivery.findMany({
          where: {
            pickupRequestId: existingPickupId,
            id: { not: delivery.id }
          }
        });
        const isShared = siblingDeliveries.length > 0;

        // If Delhivery does not support removing one shipment from a shared pickup request,
        // reject individual reschedule with a controlled error rather than creating a duplicate active pickup.
        if (isShared) {
          throw new AppError(
            `Cannot reschedule individual shipment: This shipment is part of shared pickup request #${existingPickupId} containing ${siblingDeliveries.length + 1} shipments. Delhivery does not support partial modification of shared pickup requests. Please manage the pickup for the batch or cancel pickup first.`,
            400,
            'SHARED_PICKUP_RESCHEDULE_UNSUPPORTED'
          );
        }

        try {
          await delhiveryShipmentService.cancelPickupRequest({
            pickupId: existingPickupId,
            pickupLocation: seller.pickupLocationName
          });
          oldCancelled = true;
        } catch (oldCancelErr) {
            // If old cancellation timed out, do NOT proceed with new creation
            if (oldCancelErr.isAmbiguous) {
              await prisma.integrationLog.create({
                data: {
                  id: `reschedule-cancel-timeout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  service: 'Delhivery',
                  event: 'PICKUP_RESCHEDULE_CANCEL_TIMEOUT',
                  status: 'AMBIGUOUS_TIMEOUT',
                  timestamp: new Date()
                }
              }).catch(() => {});

              try {
                const { reconciliationQueue } = await import('../jobs/reconciliation.job.js');
                if (reconciliationQueue?.add) {
                  await reconciliationQueue.add('reconcile-pickup', {
                    deliveryId: delivery.id,
                    pickupId: existingPickupId,
                    reason: 'OLD_CANCEL_TIMEOUT'
                  });
                }
              } catch (qErr) {}

              throw oldCancelErr;
            }
            // Delhivery rejected old cancellation -> abort rescheduling
          }
        }

      // 6. Create or Share Pickup with Delhivery (No blind retries)
      let newPickupData = null;
      try {
        const whereClause = {
          order: { shop: { seller: { id: seller.id, pickupLocationName: seller.pickupLocationName } } },
          pickupRequestId: { not: null },
          status: { in: ['CREATED', 'PICKUP_SCHEDULED'] },
          id: { not: delivery.id }
        };
        
        if (validatedDate) whereClause.pickupDate = validatedDate;
        if (validatedTime) whereClause.pickupSlot = validatedTime;

        const sharedPickup = await prisma.delivery.findFirst({
          where: whereClause,
          orderBy: { createdAt: 'desc' }
        });

        if (sharedPickup && sharedPickup.pickupRequestId) {
          newPickupData = {
            pickupId: sharedPickup.pickupRequestId,
            pickupDate: sharedPickup.pickupDate,
            pickupTime: sharedPickup.pickupSlot
          };
        } else {
          newPickupData = await delhiveryShipmentService.createPickupRequest(seller, expectedPackageCount, {
            pickup_date: validatedDate,
            pickup_time: validatedTime
          });
        }
      } catch (newCreateErr) {
        // NON-ATOMIC RECOVERY PATH:
        // Old cancellation succeeded, but new pickup creation failed/rejected
        if (oldCancelled && existingPickupId) {
          await prisma.delivery.update({
            where: { id: delivery.id },
            data: {
              pickupRequestId: null,
              pickupDate: null,
              pickupSlot: null,
              status: 'BOOKED',
              updatedAt: new Date()
            }
          }).catch(() => {});

          await prisma.orderShipmentLog.create({
            data: {
              orderId: delivery.orderId,
              event: 'Pickup Reschedule Incomplete',
              timestamp: new Date(),
              awbNumber: delivery.trackingNumber,
              remarks: `Previous pickup #${existingPickupId} was cancelled, but scheduling new pickup failed (${newCreateErr.message}). Delivery reset to BOOKED state; ready to re-schedule.`
            }
          }).catch(() => {});

          await prisma.integrationLog.create({
            data: {
              id: `reschedule-new-failed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              service: 'Delhivery',
              event: 'PICKUP_RESCHEDULE_CREATION_FAILED',
              status: newCreateErr.isAmbiguous ? 'AMBIGUOUS_TIMEOUT' : 'FAILED',
              timestamp: new Date()
            }
          }).catch(() => {});
        }

        if (newCreateErr.isAmbiguous) {
          try {
            const { reconciliationQueue } = await import('../jobs/reconciliation.job.js');
            if (reconciliationQueue?.add) {
              await reconciliationQueue.add('reconcile-pickup', {
                deliveryId: delivery.id,
                sellerId: seller.id,
                reason: 'NEW_CREATION_TIMEOUT'
              });
            }
          } catch (qErr) {}
        }

        throw newCreateErr;
      }

      // 7. Update Database Transactionally
      await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            pickupRequestId: newPickupData.pickupId,
            pickupDate: newPickupData.pickupDate,
            pickupSlot: newPickupData.pickupTime,
            status: 'PICKUP_SCHEDULED',
            updatedAt: new Date()
          }
        });

        const actorLabel = isAdmin ? 'ADMIN' : 'SELLER';
        const remarks = existingPickupId
          ? `Courier pickup rescheduled with Delhivery (Request #${newPickupData.pickupId}, Date: ${newPickupData.pickupDate || 'Auto'}, Slot: ${newPickupData.pickupTime || 'Auto'}) by ${actorLabel}.`
          : `Courier pickup scheduled with Delhivery (Request #${newPickupData.pickupId}, Date: ${newPickupData.pickupDate || 'Auto'}, Slot: ${newPickupData.pickupTime || 'Auto'}) by ${actorLabel}.`;

        await tx.orderShipmentLog.create({
          data: {
            orderId: delivery.orderId,
            event: existingPickupId ? 'Pickup Rescheduled' : 'Pickup Scheduled',
            timestamp: new Date(),
            awbNumber: delivery.trackingNumber,
            remarks
          }
        });

        const currentLogs = Array.isArray(delivery.order?.shipmentLogs) ? delivery.order.shipmentLogs : [];
        await tx.order.update({
          where: { id: delivery.orderId },
          data: {
            shipmentLogs: [
              ...currentLogs,
              {
                timestamp: new Date().toISOString(),
                event: existingPickupId ? 'Pickup Rescheduled' : 'Pickup Scheduled',
                awbNumber: delivery.trackingNumber,
                remarks
              }
            ]
          }
        });

        await tx.integrationLog.create({
          data: {
            id: `pickup-reschedule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: existingPickupId ? 'PICKUP_RESCHEDULE' : 'PICKUP_SCHEDULE',
            status: 'SUCCESS',
            timestamp: new Date()
          }
        });
      });

      logger.info(
        { deliveryId: delivery.id, pickupId: newPickupData.pickupId, pickupDate: newPickupData.pickupDate },
        'Completed pickup scheduling/rescheduling'
      );

      return {
        success: true,
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        trackingNumber: delivery.trackingNumber,
        deliveryStatus: 'PICKUP_SCHEDULED',
        pickupRequestId: newPickupData.pickupId,
        pickupDate: newPickupData.pickupDate,
        pickupSlot: newPickupData.pickupTime
      };
    } finally {
      await releaseLock();
    }
  },

  async retryPickup(orderId, sellerId) {
    let delivery = null;
    if (prisma.delivery?.findUnique) {
      delivery = await prisma.delivery.findUnique({
        where: { orderId },
        include: { order: { include: { shop: { include: { seller: true } } } } }
      }).catch(() => null);
    }
    if (!delivery && prisma.delivery?.findFirst) {
      delivery = await prisma.delivery.findFirst({
        where: {
          OR: [
            { id: orderId },
            { orderId }
          ]
        },
        include: { order: { include: { shop: { include: { seller: true } } } } }
      }).catch(() => null);
    }

    if (!delivery || !delivery.trackingNumber) throw new AppError('Shipment must exist before retrying pickup', 400);
    if (delivery.pickupRequestId) throw new AppError('Pickup is already scheduled', 400);

    const sellerDb = await prisma.seller.findUnique({ where: { userId: sellerId } });
    if (!sellerDb || delivery.order?.shop?.sellerId !== sellerDb.id) throw new AppError('Unauthorized', 403);

    const releaseLock = await acquirePickupLock(delivery.id);
    let pickupData;
    try {
      const existingPickup = await prisma.delivery.findFirst({
        where: {
          order: { shop: { seller: { id: sellerDb.id, pickupLocationName: sellerDb.pickupLocationName } } },
          pickupRequestId: { not: null },
          status: { in: ['CREATED', 'PICKUP_SCHEDULED'] },
          id: { not: delivery.id }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (existingPickup && existingPickup.pickupRequestId) {
        pickupData = {
          pickupId: existingPickup.pickupRequestId,
          pickupDate: existingPickup.pickupDate,
          pickupTime: existingPickup.pickupSlot
        };
      } else {
        pickupData = await delhiveryShipmentService.createPickupRequest(delivery.order?.shop?.seller, 1);
      }
      
      await prisma.delivery.update({
        where: { orderId },
        data: {
          pickupRequestId: pickupData.pickupId,
          pickupDate: pickupData.pickupDate,
          pickupSlot: pickupData.pickupTime,
          status: 'PICKUP_SCHEDULED'
        }
      });
    } finally {
      await releaseLock();
    }

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

  async getShippingLabel(orderIdOrDeliveryId, user, pdfSize) {
    const delivery = await prisma.delivery.findFirst({
      where: {
        OR: [
          { id: orderIdOrDeliveryId },
          { orderId: orderIdOrDeliveryId }
        ]
      },
      include: { order: { include: { shop: true } } }
    });

    if (!delivery) {
      throw new AppError('Delivery record not found.', 404, 'DELIVERY_NOT_FOUND');
    }

    if (user.role === 'SELLER') {
      const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
      if (!seller || delivery.order.shop.sellerId !== seller.id) {
        throw new AppError('Unauthorized access to delivery record.', 403, 'UNAUTHORIZED_ACCESS');
      }
    }

    if (!delivery.trackingNumber) {
      throw new AppError('Shipment is not manifested yet. No waybill found.', 400, 'LABEL_WAYBILL_REQUIRED');
    }

    const invalidStates = ['CANCELLED', 'REFUNDED', 'FAILED'];
    if (invalidStates.includes(delivery.status)) {
      throw new AppError(`Cannot generate label for a shipment in ${delivery.status} state.`, 400, 'INVALID_DELIVERY_STATE');
    }

    if (delivery.shippingLabelUrl && !pdfSize) {
      return {
        shippingLabelUrl: delivery.shippingLabelUrl,
        waybill: delivery.trackingNumber,
        format: 'pdf',
        size: 'A4'
      };
    }

    const LOCK_KEY = `delhivery:shipping-label:lock:${delivery.trackingNumber}`;
    let lockAcquired = false;
    
    const { redis } = await import('../../../config/redis.js');
    if (redis && redis.isOpen) {
      const setnx = await redis.set(LOCK_KEY, 'LOCKED', { NX: true, EX: 15 });
      if (!setnx) {
        throw new AppError('Shipping label generation is already in progress. Please try again in a few seconds.', 429, 'DELHIVERY_LABEL_RATE_LIMITED');
      }
      lockAcquired = true;
    }

    try {
      const generatedUrl = await delhiveryShipmentService.generateShippingLabel(delivery.trackingNumber, pdfSize);

      if (!pdfSize) {
        await prisma.delivery.update({
          where: { id: delivery.id },
          data: { shippingLabelUrl: generatedUrl }
        });
      }

      return {
        shippingLabelUrl: generatedUrl,
        waybill: delivery.trackingNumber,
        format: 'pdf',
        size: pdfSize || 'A4'
      };
    } finally {
      if (lockAcquired && redis && redis.isOpen) {
        await redis.del(LOCK_KEY);
      }
    }
  },

  normalizeTrackingEvent(awb, rawStatus, rawDescription, rawTimestamp) {
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
    
    const status = statusMap[rawStatus] || 'IN_TRANSIT';
    const description = String(rawDescription || rawStatus || '').trim().substring(0, 255);
    
    const dateObj = rawTimestamp ? new Date(rawTimestamp) : new Date();
    // Normalize to exact ISO timestamp for precise event deduplication
    const exactTimestamp = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : new Date().toISOString();
    
    const fingerprintPayload = `${awb}|${status}|${description.toLowerCase()}|${exactTimestamp}`;
    const fingerprint = createHash('sha256').update(fingerprintPayload).digest('hex');

    return {
      status,
      description,
      eventTime: !isNaN(dateObj.getTime()) ? dateObj : new Date(),
      fingerprint
    };
  },

  async processTrackingUpdate(delivery, normalizedEvent, isCurrentStatus = false) {
    return prisma.$transaction(async (tx) => {
      // 1. Insert Historical Scan
      await tx.deliveryTrackingEvent.createMany({
        data: [{
          deliveryId: delivery.id,
          status: normalizedEvent.status,
          description: normalizedEvent.description,
          eventTime: normalizedEvent.eventTime,
          fingerprint: normalizedEvent.fingerprint
        }],
        skipDuplicates: true
      });

      // 2. State Machine Update (Only if this event represents the CURRENT shipment status)
      if (isCurrentStatus && delivery.status !== normalizedEvent.status) {
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
        const newRank = STATUS_RANKS[normalizedEvent.status] ?? -1;

        if (newRank < currentRank) {
          const isReattempt = delivery.status === 'NDR' && ['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(normalizedEvent.status);
          if (!isReattempt) {
            logger.warn({ trackingNumber: delivery.trackingNumber, oldStatus: delivery.status, newStatus: normalizedEvent.status }, 'Ignored out-of-order backward status transition');
            return null; // Return null so we know status wasn't changed
          }
        }

        const updateData = { status: normalizedEvent.status };
        
        if (normalizedEvent.status === 'PICKED_UP') updateData.pickedUpAt = new Date();
        if (normalizedEvent.status === 'IN_TRANSIT' && !delivery.shippedAt) updateData.shippedAt = new Date();
        if (normalizedEvent.status === 'OUT_FOR_DELIVERY') updateData.outForDeliveryAt = new Date();
        if (normalizedEvent.status === 'DELIVERED') {
          updateData.deliveredAt = new Date();
          updateData.deliveryVerifiedAt = new Date(); 
        }

        const updatedDelivery = await tx.delivery.update({
          where: { id: delivery.id },
          data: updateData
        });

        // Sync Order Status
        const orderStatusMap = {
          'CREATED': 'PROCESSING',
          'PICKUP_SCHEDULED': 'PROCESSING',
          'READY_FOR_PICKUP': 'PROCESSING',
          'PICKED_UP': 'SHIPPED',
          'IN_TRANSIT': 'SHIPPED',
          'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
          'DELIVERED': 'DELIVERED',
          'RTO': 'RTO',
          'NDR': 'SHIPPED', 
          'RETURNED': 'RETURNED',
          'CANCELLED': 'CANCELLED'
        };

        const newOrderStatus = orderStatusMap[normalizedEvent.status];
        if (newOrderStatus && delivery.order?.status !== newOrderStatus) {
          await tx.order.update({
            where: { id: delivery.orderId },
            data: { status: newOrderStatus }
          });

          if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(newOrderStatus)) {
            notificationService.createAndEmit(
              delivery.order.customerId, 'ORDER_STATUS_UPDATED', 'Order Status Update 📦',
              `Your order #${delivery.order.orderNumber} is now ${newOrderStatus.replace(/_/g, ' ')}.`,
              { orderId: delivery.orderId, status: newOrderStatus }
            ).catch(() => {});
            notificationService.createAndEmit(
              delivery.order.shop?.seller?.userId, 'ORDER_STATUS_UPDATED', 'Logistics Update',
              `Order #${delivery.order.orderNumber} logistics status: ${normalizedEvent.status}`,
              { orderId: delivery.orderId, status: newOrderStatus }
            ).catch(() => {});
          }
        }
        
        return updatedDelivery;
      }
      return null;
    });
  },

  async handleWebhookEvent(payload) {
    const trackingNumber = payload.awb || payload.Waybill || (payload.Shipment && payload.Shipment.AWB);
    if (!trackingNumber) return;

    const delivery = await prisma.delivery.findUnique({
      where: { trackingNumber },
      include: { order: { include: { shop: { include: { seller: true } } } } }
    });
    
    if (!delivery) {
      logger.warn({ trackingNumber }, 'Webhook received for unknown tracking number');
      return;
    }

    const rawStatus = payload.status || payload.Status?.Status || payload.Status?.StatusType || '';
    const description = payload.instructions || payload.Status?.Instructions || payload.Status?.StatusLocation || rawStatus;
    const rawTimestamp = payload.status_datetime || payload.Status?.StatusDateTime || payload.ScanDateTime || null;
    
    const normalizedEvent = this.normalizeTrackingEvent(trackingNumber, rawStatus, description, rawTimestamp);
    await this.processTrackingUpdate(delivery, normalizedEvent, true);
  },

  async getTracking(orderId, forceRefresh = false) {
    const delivery = await prisma.delivery.findFirst({
      where: { orderId },
      include: {
        events: {
          orderBy: { eventTime: 'asc' }
        },
        order: { include: { shop: { include: { seller: true } } } }
      }
    });

    if (!delivery) throw new AppError('Delivery not found for this order', 404);

    if (forceRefresh && delivery.trackingNumber) {
      const delhiveryShipmentService = require('./delhiveryShipmentService.js').delhiveryShipmentService;
      const trackingResult = await delhiveryShipmentService.trackShipment(delivery.trackingNumber);
      
      if (trackingResult) {
        // Sync the events
        for (const scan of trackingResult.events || []) {
          const normalized = this.normalizeTrackingEvent(delivery.trackingNumber, scan.status, scan.location, scan.date);
          await this.processTrackingUpdate(delivery, normalized, false);
        }
        
        // Sync current status
        if (trackingResult.status) {
          const normalizedCurrent = this.normalizeTrackingEvent(delivery.trackingNumber, trackingResult.rawStatus || trackingResult.status, trackingResult.currentLocation, new Date());
          await this.processTrackingUpdate(delivery, normalizedCurrent, true);
        }
        
        // Refetch after updates
        return await prisma.delivery.findFirst({
          where: { orderId },
          include: {
            events: {
              orderBy: { eventTime: 'asc' }
            }
          }
        });
      }
    }

    return delivery;
  },

  async getPublicTracking(identifier) {
    // 1. Resolve Delivery (Order Number or AWB)
    let delivery;
    const isAwb = /^\d{12,18}$/.test(identifier);

    if (!isAwb) {
      // Must be an Order Number
      const order = await prisma.order.findUnique({
        where: { orderNumber: identifier },
        include: { delivery: true }
      });
      
      if (!order || !order.delivery) {
        throw new AppError('Tracking information not found for this order.', 404);
      }
      delivery = order.delivery;
    } else {
      // Direct AWB
      delivery = await prisma.delivery.findUnique({
        where: { trackingNumber: identifier }
      });
    }

    if (!delivery || !delivery.trackingNumber) {
      throw new AppError('Tracking information not found.', 404);
    }

    // 2. Fetch live data from Delhivery
    const delhiveryShipmentService = require('./delhiveryShipmentService.js').delhiveryShipmentService;
    const trackingResult = await delhiveryShipmentService.trackShipment(delivery.trackingNumber);
    
    if (!trackingResult) {
      throw new AppError('Could not fetch tracking data from courier at this time.', 503);
    }

    // 3. Process events asynchronously to update local cache
    setTimeout(async () => {
      try {
        const fullDelivery = await prisma.delivery.findUnique({
          where: { id: delivery.id },
          include: { order: { include: { shop: { include: { seller: true } } } } }
        });
        
        for (const scan of trackingResult.events || []) {
          const normalized = this.normalizeTrackingEvent(delivery.trackingNumber, scan.status, scan.location, scan.date);
          await this.processTrackingUpdate(fullDelivery, normalized, false);
        }
        
        if (trackingResult.status) {
          const normalizedCurrent = this.normalizeTrackingEvent(delivery.trackingNumber, trackingResult.rawStatus || trackingResult.status, trackingResult.currentLocation, new Date());
          await this.processTrackingUpdate(fullDelivery, normalizedCurrent, true);
        }
      } catch (err) {
        logger.error({ err: err.message, awb: delivery.trackingNumber }, 'Background tracking sync failed');
      }
    }, 0);

    // 4. Return PII-stripped response
    // Only map the latest cached events + what we just fetched. 
    // To ensure consistency, we'll format the trackingResult.events.
    const formattedEvents = (trackingResult.events || []).map(e => {
      const normalized = this.normalizeTrackingEvent(delivery.trackingNumber, e.status, e.location, e.date);
      return {
        status: normalized.status,
        description: normalized.description,
        date: normalized.eventTime
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate current status (using Cravo normalized status from the Delhivery current status)
    const normalizedCurrent = this.normalizeTrackingEvent(delivery.trackingNumber, trackingResult.rawStatus || trackingResult.status, trackingResult.currentLocation, new Date());

    return {
      awb: delivery.trackingNumber,
      courier: 'DELHIVERY',
      status: normalizedCurrent.status,
      events: formattedEvents
    };
  },

  /**
   * Validates actor authorization for shipment/order cancellation
   */
  async validateCancellationAuthorization(order, actor = {}) {
    if (!actor || !actor.id) {
      throw new AppError('Authentication required to cancel shipment.', 401, 'UNAUTHORIZED');
    }

    if (actor.role === 'ADMIN') {
      return true;
    }

    if (actor.role === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { userId: actor.id }
      });
      if (!seller || (order.shop?.sellerId !== seller.id && order.shop?.seller?.userId !== actor.id)) {
        throw new AppError('You are not authorized to cancel this shipment.', 403, 'FORBIDDEN');
      }
      return true;
    }

    // Customer
    if (order.customerId !== actor.id) {
      throw new AppError('You are not authorized to cancel this shipment.', 403, 'FORBIDDEN');
    }
    return true;
  },

  /**
   * Orchestrates payment refund outside of the database transaction (Rule 1)
   */
  async orchestrateOrderRefund(order, reason = 'Shipment Cancelled') {
    if (!order || !Array.isArray(order.payments) || order.payments.length === 0) {
      return null;
    }

    const successfulPayment = order.payments.find(p => p.status === 'SUCCESS');
    if (!successfulPayment) {
      return null;
    }

    try {
      const { refundService } = await import('../../payments/services/refund.service.js');
      const idempotencyKey = `refund-cancel-${order.id}`;
      const refundRecord = await refundService.initiateRefund(
        successfulPayment.id,
        successfulPayment.amount,
        reason || 'Shipment / Order Cancelled',
        idempotencyKey
      );
      logger.info(
        { orderId: order.id, paymentId: successfulPayment.id, refundId: refundRecord?.id },
        'Initiated refund for cancelled order outside DB transaction'
      );
      return refundRecord;
    } catch (refundErr) {
      // Refund errors do not revert the cancelled DB state; flagged for webhook/reconciliation
      logger.error(
        { err: refundErr.message, orderId: order.id, paymentId: successfulPayment.id },
        'Automated refund initiation encountered an error. Awaiting reconciliation.'
      );
      return null;
    }
  },

  /**
   * Executes local cancellation when no Delhivery shipment/AWB exists
   */
  async executeLocalCancellationTransaction({ order, delivery, actor, reason }) {
    const actorRole = actor.role || 'USER';

    return prisma.$transaction(async (tx) => {
      // 1. Update Order status to CANCELLED
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          shippingLabelUrl: null,
          trackingStatus: 'cancelled'
        }
      });

      // 2. Update Delivery status if record exists
      if (delivery) {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            status: 'CANCELLED',
            shippingLabelUrl: null,
            updatedAt: new Date()
          }
        });
      }

      // 3. Release reserved stock using existing atomic logic
      for (const item of (order.items || [])) {
        const inventoryBefore = await tx.inventory.findUnique({
          where: { productVariantId: item.productVariantId }
        });
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
              reason: `Order cancelled locally by ${actorRole}`,
              createdBy: actor.id || null
            }
          });
        }
      }

      // 4. OrderShipmentLog
      await tx.orderShipmentLog.create({
        data: {
          orderId: order.id,
          event: 'Order Cancelled',
          timestamp: new Date(),
          awbNumber: delivery?.trackingNumber || null,
          shipmentId: delivery?.delhiveryShipmentId || null,
          remarks: `Order cancelled locally without Delhivery dispatch by ${actorRole}. Reason: ${reason || 'Not specified'}`
        }
      });

      return {
        success: true,
        orderId: order.id,
        deliveryId: delivery?.id || null,
        waybill: null,
        status: 'CANCELLED',
        message: 'Order cancelled successfully'
      };
    });
  },

  /**
   * Delhivery Shipment Cancellation Service
   * Manages Delhivery cancellation, domain state, atomic stock release,
   * label invalidation, and asynchronous refund orchestration.
   */
  async cancelShipment(deliveryIdOrOrderId, actor = {}, options = {}) {
    if (!deliveryIdOrOrderId) {
      throw new AppError('Delivery ID or Order ID is required.', 400, 'INVALID_ID');
    }

    // Cravo is 100% non-COD: reject cod if supplied
    if (options && 'cod' in options) {
      throw new AppError('Cravo does not support COD. The cod field cannot be supplied.', 400, 'COD_NOT_SUPPORTED');
    }

    // 1. Resolve Delivery record
    const delivery = await prisma.delivery.findFirst({
      where: {
        OR: [
          { id: deliveryIdOrOrderId },
          { orderId: deliveryIdOrOrderId }
        ]
      },
      include: {
        order: {
          include: {
            shop: { include: { seller: true } },
            address: true,
            items: true,
            payments: true
          }
        }
      }
    });

    // 2. If no Delivery record or Delivery has no AWB / not created with Delhivery (Rule 6)
    if (!delivery || !delivery.trackingNumber || ['NOT_CREATED', 'PENDING'].includes(delivery.status)) {
      const resolvedOrderId = delivery?.orderId || deliveryIdOrOrderId;
      const order = delivery?.order || await prisma.order.findUnique({
        where: { id: resolvedOrderId },
        include: {
          shop: { include: { seller: true } },
          items: true,
          payments: true
        }
      });

      if (!order) {
        throw new AppError('Delivery or Order not found.', 404, 'NOT_FOUND');
      }

      await this.validateCancellationAuthorization(order, actor);

      const localResult = await this.executeLocalCancellationTransaction({
        order,
        delivery,
        actor,
        reason: options.reason || 'Cancelled by user'
      });

      // OUTSIDE TRANSACTION: Orchestrate refund if prepaid
      await this.orchestrateOrderRefund(order, options.reason);

      return localResult;
    }

    // 3. Manifested shipment validation
    const order = delivery.order;
    if (!order) {
      throw new AppError('Associated order not found for delivery.', 404, 'ORDER_NOT_FOUND');
    }

    await this.validateCancellationAuthorization(order, actor);

    // 4. State Matrix Enforcement
    // Idempotency: If already CANCELLED
    if (delivery.status === 'CANCELLED') {
      return {
        success: true,
        alreadyCancelled: true,
        deliveryId: delivery.id,
        orderId: order.id,
        waybill: delivery.trackingNumber,
        status: 'CANCELLED',
        message: 'Shipment is already cancelled.'
      };
    }

    // Blocked states: Picked up, in transit, out for delivery, delivered, returned, RTO
    const BLOCKED_STATES = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'RTO'];
    if (BLOCKED_STATES.includes(delivery.status)) {
      throw new AppError(
        `Shipment cannot be cancelled once picked up or in state ${delivery.status}. Delhivery prohibits cancellation in this state.`,
        400,
        'CANNOT_CANCEL_SHIPMENT'
      );
    }

    // Allowed pre-pickup states: CREATED, BOOKED, PICKUP_SCHEDULED, READY_FOR_PICKUP, FAILED
    const ALLOWED_PRE_PICKUP = ['CREATED', 'BOOKED', 'PICKUP_SCHEDULED', 'READY_FOR_PICKUP', 'FAILED'];
    if (!ALLOWED_PRE_PICKUP.includes(delivery.status)) {
      throw new AppError(
        `Shipment cannot be cancelled in state ${delivery.status}.`,
        400,
        'INVALID_STATE_FOR_CANCELLATION'
      );
    }

    // 5. Call Delhivery /api/p/edit with { waybill, cancellation: "true" }
    let cancelResult;
    try {
      cancelResult = await delhiveryShipmentService.cancelShipment(delivery.trackingNumber, options);
    } catch (delhiveryErr) {
      if (delhiveryErr.isAmbiguous) {
        await prisma.integrationLog.create({
          data: {
            id: `shipment-cancel-ambiguous-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'SHIPMENT_CANCEL',
            status: 'AMBIGUOUS_TIMEOUT',
            timestamp: new Date()
          }
        }).catch(() => {});
      }
      throw delhiveryErr;
    }

    // 6. Cravo DB Transaction:
    // Update Delivery, Order, clear labels, release stock using existing atomic logic, record audit logs
    const actorRole = actor.role || 'SYSTEM';
    let cancellationResult;

    try {
      cancellationResult = await prisma.$transaction(async (tx) => {
        // Update Delivery status to CANCELLED & clear label
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            status: 'CANCELLED',
            shippingLabelUrl: null,
            updatedAt: new Date()
          }
        });

        // Update Order status to CANCELLED & clear label
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            shippingLabelUrl: null,
            trackingStatus: 'cancelled'
          }
        });

        // Release reserved stock using Cravo's established atomic update logic
        for (const item of (order.items || [])) {
          const inventoryBefore = await tx.inventory.findUnique({
            where: { productVariantId: item.productVariantId }
          });
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
                reason: `Shipment cancelled with Delhivery by ${actorRole}`,
                createdBy: actor.id || null
              }
            });
          }
        }

        // OrderShipmentLog
        await tx.orderShipmentLog.create({
          data: {
            orderId: order.id,
            event: 'Shipment Cancelled',
            timestamp: new Date(),
            awbNumber: delivery.trackingNumber,
            shipmentId: delivery.delhiveryShipmentId,
            remarks: `Shipment cancelled on Delhivery by ${actorRole}. Reason: ${options.reason || 'Not specified'}`
          }
        });

        // Append to order.shipmentLogs JSON array
        const currentLogs = Array.isArray(order.shipmentLogs) ? order.shipmentLogs : [];
        const newLogEntry = {
          timestamp: new Date().toISOString(),
          event: 'Shipment Cancelled',
          awbNumber: delivery.trackingNumber,
          shipmentId: delivery.delhiveryShipmentId,
          remarks: `Shipment cancelled on Delhivery by ${actorRole}`
        };
        await tx.order.update({
          where: { id: order.id },
          data: {
            shipmentLogs: [...currentLogs, newLogEntry]
          }
        });

        // IntegrationLog
        await tx.integrationLog.create({
          data: {
            id: `shipment-cancel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'SHIPMENT_CANCEL',
            status: 'SUCCESS',
            timestamp: new Date()
          }
        });

        // Note: DelhiveryWaybill remains status 'USED' - never reset to 'AVAILABLE' (Rule 4 & 7)
        return {
          success: true,
          deliveryId: delivery.id,
          orderId: order.id,
          waybill: delivery.trackingNumber,
          status: 'CANCELLED',
          message: 'Shipment cancelled successfully'
        };
      });
    } catch (dbError) {
      logger.error(
        {
          err: dbError.message,
          deliveryId: delivery.id,
          waybill: delivery.trackingNumber
        },
        'CRITICAL: Delhivery shipment cancellation succeeded on courier side, but local database update failed! Flagging for reconciliation.'
      );

      await prisma.integrationLog.create({
        data: {
          id: `shipment-cancel-reconcile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          service: 'Delhivery',
          event: 'SHIPMENT_CANCEL_DB_FAILED',
          status: 'NEEDS_RECONCILIATION',
          timestamp: new Date()
        }
      }).catch(logErr => logger.error({ err: logErr.message }, 'Failed to record reconciliation integration log'));

      try {
        const { reconciliationQueue } = await import('../jobs/reconciliation.job.js');
        if (reconciliationQueue && typeof reconciliationQueue.add === 'function') {
          await reconciliationQueue.add('reconcile-cancelled-shipment', {
            deliveryId: delivery.id,
            waybill: delivery.trackingNumber,
            reason: 'POST_DELHIVERY_DB_SYNC_FAILED'
          });
        }
      } catch (queueErr) {
        logger.warn({ err: queueErr.message }, 'Could not add to reconciliation queue');
      }

      const syncErr = new AppError(
        'Shipment was successfully cancelled with Delhivery, but updating local database records failed. The shipment has been flagged for background reconciliation.',
        500,
        'POST_DELHIVERY_DB_SYNC_FAILED'
      );
      syncErr.errorCode = 'POST_DELHIVERY_DB_SYNC_FAILED';
      syncErr.meta = {
        waybill: delivery.trackingNumber,
        updatedOnDelhivery: true
      };
      throw syncErr;
    }

    // 7. OUTSIDE TRANSACTION: Orchestrate refund if prepaid (Rule 1)
    await this.orchestrateOrderRefund(order, options.reason);

    // 8. Notifications (fire-and-forget)
    if (order.customerId) {
      notificationService.createAndEmit(
        order.customerId,
        'ORDER_CANCELLED',
        'Shipment Cancelled',
        `Your order #${order.orderNumber} shipment has been cancelled.`,
        { orderId: order.id, orderNumber: order.orderNumber }
      ).catch(() => {});
    }
    if (order.shop?.seller?.userId && actor.id !== order.shop.seller.userId) {
      notificationService.createAndEmit(
        order.shop.seller.userId,
        'ORDER_CANCELLED',
        'Shipment Cancelled',
        `Shipment for Order #${order.orderNumber} has been cancelled by ${actorRole}.`,
        { orderId: order.id, orderNumber: order.orderNumber }
      ).catch(() => {});
    }

    return cancellationResult;
  },


  /**
   * Shipment Updation / Edit Service
   * Allows authorized Sellers or Admins to update shipment details prior to courier pickup.
   * Resolves Delivery -> trackingNumber (waybill) -> calls Delhivery /api/p/edit.
   */
  async updateShipment(deliveryId, updates = {}, actor = {}) {
    if (!deliveryId) {
      throw new AppError('Delivery ID or Order ID is required.', 400, 'INVALID_DELIVERY_ID');
    }

    // 1. Resolve Delivery record
    const delivery = await prisma.delivery.findFirst({
      where: {
        OR: [{ id: deliveryId }, { orderId: deliveryId }]
      },
      include: {
        order: {
          include: {
            address: true,
            shop: { include: { seller: true } },
            items: { include: { productVariant: true } }
          }
        }
      }
    });

    if (!delivery) {
      throw new AppError('Delivery was not found.', 404, 'DELIVERY_NOT_FOUND');
    }

    if (!delivery.trackingNumber) {
      throw new AppError('Cannot edit shipment: No tracking number/AWB assigned yet.', 400, 'NO_TRACKING_NUMBER');
    }

    // 2. Ownership & Authorization Check
    const isAdmin = actor?.role === 'ADMIN';
    const isSeller = actor?.role === 'SELLER';
    const sellerUserId = delivery.order?.shop?.seller?.userId;
    const sellerId = delivery.order?.shop?.seller?.id;

    if (!isAdmin) {
      if (!isSeller || (actor?.id !== sellerUserId && actor?.sellerId !== sellerId && actor?.seller?.id !== sellerId)) {
        throw new AppError('You do not have permission to edit this shipment.', 403, 'FORBIDDEN');
      }
    }

    // 3. Delivery State Restriction Guard
    // Edits are only permitted prior to courier physical possession/collection
    const ALLOWED_EDIT_STATES = ['CREATED', 'BOOKED', 'PICKUP_SCHEDULED', 'READY_FOR_PICKUP', 'FAILED'];
    if (!ALLOWED_EDIT_STATES.includes(delivery.status)) {
      throw new AppError(
        `Cannot edit shipment in ${delivery.status} state. Edits are only permitted before courier pickup.`,
        400,
        'INVALID_DELIVERY_STATE'
      );
    }

    // 4. Strict Validation of Input Fields
    // Cravo does NOT support COD - explicitly reject if client provided cod
    if ('cod' in updates) {
      throw new AppError('Cravo does not support COD. Cannot update shipment with COD.', 400, 'COD_NOT_SUPPORTED');
    }

    const sanitizedUpdates = {};

    // Validate phone
    if (updates.phone !== undefined) {
      const cleanPhone = String(updates.phone).replace(/\s+/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone) && !/^\d{10}$/.test(cleanPhone)) {
        throw new AppError('Please provide a valid 10-digit phone number.', 400, 'INVALID_PHONE');
      }
      sanitizedUpdates.phone = cleanPhone;
    }

    // Validate weight
    if (updates.weight !== undefined) {
      const w = Number(updates.weight);
      if (Number.isNaN(w) || !Number.isFinite(w) || w <= 0) {
        throw new AppError('Shipment weight must be a positive number.', 400, 'INVALID_WEIGHT');
      }
      sanitizedUpdates.weight = w.toString();
    }

    // Validate dimensions
    for (const dim of ['shipment_length', 'shipment_width', 'shipment_height']) {
      if (updates[dim] !== undefined) {
        const d = Number(updates[dim]);
        if (Number.isNaN(d) || !Number.isFinite(d) || d <= 0) {
          throw new AppError(`Shipment dimension ${dim} must be a positive number.`, 400, 'INVALID_DIMENSION');
        }
        sanitizedUpdates[dim] = d;
      }
    }

    // Pass through other allowed scalar fields
    for (const key of ['name', 'address', 'city', 'state', 'product_details']) {
      if (updates[key] !== undefined && updates[key] !== null) {
        const val = String(updates[key]).trim();
        if (val.length > 0) {
          sanitizedUpdates[key] = val;
        }
      }
    }

    // 5. Destination change & Pincode Serviceability re-check
    const hasAddressChange = Boolean(
      updates.pin !== undefined ||
      sanitizedUpdates.address ||
      sanitizedUpdates.city ||
      sanitizedUpdates.state
    );

    if (hasAddressChange) {
      let targetPin = null;
      if (updates.pin !== undefined) {
        const cleanPin = String(updates.pin).trim();
        if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
          throw new AppError('Please provide a valid 6-digit Indian pincode.', 400, 'INVALID_PINCODE');
        }
        targetPin = cleanPin;
        sanitizedUpdates.pin = cleanPin;
      } else {
        targetPin = (delivery.order?.address?.postalCode || '').trim();
      }

      if (!targetPin || !/^[1-9][0-9]{5}$/.test(targetPin)) {
        throw new AppError(
          'A valid 6-digit destination pincode is required for address updates.',
          400,
          'INVALID_PINCODE'
        );
      }

      // Calculate weight in grams (consistent with existing checkout & shipment-creation flow)
      const currentWeightGrams = sanitizedUpdates.weight
        ? Number(sanitizedUpdates.weight)
        : ((delivery.order?.items || []).reduce((sum, item) => {
            const itemWeight = item.productVariant?.weight || item.weightGrams || 500;
            return sum + (itemWeight * (item.quantity || 1));
          }, 0) || 500);

      // Heavy classification: 10,000 grams = 10 kg
      const isHeavy = currentWeightGrams >= 10000;

      const serviceability = await delhiveryService.checkServiceability(targetPin, {
        productType: isHeavy ? 'Heavy' : 'B2C'
      });

      if (!serviceability || !serviceability.serviceable) {
        throw new AppError(
          `Destination pincode ${targetPin} is not serviceable by Delhivery for this shipment.`,
          400,
          'PINCODE_NOT_SERVICEABLE'
        );
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new AppError('At least one editable field must be provided.', 400, 'NO_EDIT_FIELDS');
    }

    // 6. Call Delhivery /api/p/edit
    let editResult;
    try {
      editResult = await delhiveryShipmentService.editShipment(delivery.trackingNumber, sanitizedUpdates);
    } catch (delhiveryErr) {
      if (delhiveryErr.isAmbiguous) {
        await prisma.integrationLog.create({
          data: {
            id: `shipment-edit-ambiguous-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'SHIPMENT_EDIT',
            status: 'AMBIGUOUS_TIMEOUT',
            timestamp: new Date()
          }
        }).catch(() => {});
      }
      throw delhiveryErr;
    }

    // 7. Database Consistency Update upon confirmed Delhivery success
    const actorRole = isAdmin ? 'ADMIN' : 'SELLER';
    const auditFields = editResult.updatedFields || Object.keys(sanitizedUpdates);

    try {
      // Update destination Address if address/contact details changed
      if (delivery.order?.addressId && (sanitizedUpdates.name || sanitizedUpdates.phone || sanitizedUpdates.address || sanitizedUpdates.pin || sanitizedUpdates.city || sanitizedUpdates.state)) {
        await prisma.address.update({
          where: { id: delivery.order.addressId },
          data: {
            ...(sanitizedUpdates.name ? { fullName: sanitizedUpdates.name } : {}),
            ...(sanitizedUpdates.phone ? { phone: sanitizedUpdates.phone } : {}),
            ...(sanitizedUpdates.address ? { addressLine1: sanitizedUpdates.address } : {}),
            ...(sanitizedUpdates.pin ? { postalCode: sanitizedUpdates.pin } : {}),
            ...(sanitizedUpdates.city ? { city: sanitizedUpdates.city } : {}),
            ...(sanitizedUpdates.state ? { state: sanitizedUpdates.state } : {})
          }
        });
      }

      // Invalidate old shipping label & attempt fresh regeneration
      let freshLabelUrl = null;
      try {
        freshLabelUrl = await delhiveryShipmentService.generateShippingLabel(delivery.trackingNumber);
      } catch (labelErr) {
        logger.warn({ err: labelErr.message, trackingNumber: delivery.trackingNumber }, 'Could not immediately regenerate label after edit');
      }

      await prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          shippingLabelUrl: freshLabelUrl || null,
          updatedAt: new Date()
        }
      });

      if (delivery.orderId) {
        await prisma.order.update({
          where: { id: delivery.orderId },
          data: {
            shippingLabelUrl: freshLabelUrl || null
          }
        });

        await prisma.orderShipmentLog.create({
          data: {
            orderId: delivery.orderId,
            event: 'Shipment Edited',
            timestamp: new Date(),
            awbNumber: delivery.trackingNumber,
            shipmentId: delivery.delhiveryShipmentId,
            remarks: `Shipment fields updated: ${auditFields.join(', ')} by ${actorRole}`
          }
        });

        const currentLogs = Array.isArray(delivery.order?.shipmentLogs) ? delivery.order.shipmentLogs : [];
        const newLogEntry = {
          timestamp: new Date().toISOString(),
          event: 'Shipment Edited',
          awbNumber: delivery.trackingNumber,
          shipmentId: delivery.delhiveryShipmentId,
          remarks: `Shipment fields updated: ${auditFields.join(', ')} by ${actorRole}`
        };

        await prisma.order.update({
          where: { id: delivery.orderId },
          data: {
            shipmentLogs: [...currentLogs, newLogEntry]
          }
        });
      }

      // IntegrationLog (Audit without sensitive PII)

      await prisma.integrationLog.create({
        data: {
          id: `shipment-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          service: 'Delhivery',
          event: 'SHIPMENT_EDIT',
          status: 'SUCCESS',
          timestamp: new Date()
        }
      });

      logger.info(
        { deliveryId: delivery.id, trackingNumber: delivery.trackingNumber, updatedFields: auditFields },
        'Completed Cravo shipment update'
      );

      return {
        success: true,
        deliveryId: delivery.id,
        waybill: delivery.trackingNumber,
        updatedFields: auditFields,
        shippingLabelUrl: freshLabelUrl
      };
    } catch (dbError) {
      logger.error(
        {
          err: dbError.message,
          deliveryId: delivery.id,
          waybill: delivery.trackingNumber,
          updatedFields: auditFields
        },
        'CRITICAL: Delhivery shipment edit succeeded on courier side, but local database update failed! Flagging for reconciliation.'
      );

      await prisma.integrationLog.create({
        data: {
          id: `shipment-edit-reconcile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          service: 'Delhivery',
          event: 'SHIPMENT_EDIT_DB_FAILED',
          status: 'NEEDS_RECONCILIATION',
          timestamp: new Date()
        }
      }).catch(logErr => logger.error({ err: logErr.message }, 'Failed to record reconciliation integration log'));

      try {
        const { reconciliationQueue } = await import('../jobs/reconciliation.job.js');
        if (reconciliationQueue && typeof reconciliationQueue.add === 'function') {
          await reconciliationQueue.add('reconcile-edited-shipment', {
            deliveryId: delivery.id,
            waybill: delivery.trackingNumber,
            reason: 'POST_DELHIVERY_DB_SYNC_FAILED',
            updatedFields: auditFields
          });
        }
      } catch (queueErr) {
        logger.warn({ err: queueErr.message }, 'Could not add to reconciliation queue');
      }

      const syncErr = new AppError(
        'Shipment was successfully updated with Delhivery, but updating local database records failed. The shipment has been flagged for background reconciliation.',
        500,
        'POST_DELHIVERY_DB_SYNC_FAILED'
      );
      syncErr.errorCode = 'POST_DELHIVERY_DB_SYNC_FAILED';
      syncErr.meta = {
        waybill: delivery.trackingNumber,
        updatedOnDelhivery: true,
        updatedFields: auditFields
      };
      throw syncErr;
    }
  },

  /**
   * Validates actor authorization for shipment cancellation
   * Reuses existing Cravo permissions and customer cancellation window
   */
  async validateCancellationAuthorization(order, actor = {}) {
    if (!actor) {
      throw new AppError('Authentication required to cancel shipment', 401);
    }

    if (actor.role === 'ADMIN') {
      return true;
    }

    // Check Seller ownership
    if (actor.role === 'SELLER') {
      const sellerUserId = order?.shop?.seller?.userId;
      const sellerId = order?.shop?.sellerId;
      const actorUserId = actor.userId || actor.id;
      const actorSellerId = actor.sellerId;

      if ((sellerUserId && sellerUserId === actorUserId) || (sellerId && sellerId === actorSellerId)) {
        return true;
      }
      throw new AppError('Unauthorized: You do not have permission to cancel shipments for this order', 403);
    }

    // Check Customer ownership & cancellation window
    const customerId = order?.customerId;
    const actorId = actor.id || actor.userId;
    if (customerId && customerId === actorId) {
      const settings = await orderSettingsService.get();
      if (!settings.allowCustomerCancellation) {
        throw new AppError('Customer cancellation is disabled.', 400);
      }
      const minutesElapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
      if (minutesElapsed > settings.customerCancellationWindowMins) {
        throw new AppError(`Cancellation window of ${settings.customerCancellationWindowMins} minutes has expired.`, 400);
      }
      return true;
    }

    throw new AppError('Unauthorized access to shipment cancellation', 403);
  },

  /**
   * Orchestrates refund for a cancelled order OUTSIDE the database transaction.
   * Prevents external gateway calls from interfering with DB rollback semantics.
   */
  async orchestrateOrderRefund(order, reason) {
    if (!order) return null;
    const successfulPayment = order.payments?.find(p => p.status === 'SUCCESS');
    if (!successfulPayment) {
      logger.info({ orderId: order.id }, 'No successful payment found to refund for cancelled order');
      return null;
    }

    const idempotencyKey = `refund-cancel-${order.id}`;
    try {
      const refundResult = await refundService.initiateRefund(
        successfulPayment.id,
        successfulPayment.amount,
        reason || `Refund for cancelled order #${order.orderNumber}`,
        idempotencyKey
      );
      logger.info({ orderId: order.id, refundId: refundResult.id }, 'Refund initiated successfully for cancelled order');
      return refundResult;
    } catch (refundErr) {
      // Do not throw; refund remains PENDING or tracked in error for webhook/reconciliation
      logger.error(
        { err: refundErr.message, orderId: order.id, paymentId: successfulPayment.id },
        'Refund orchestration failed for cancelled order'
      );
      return null;
    }
  },

  /**
   * Executes purely local order & delivery cancellation for pre-shipment state (no Delhivery AWB manifested)
   */
  async executeLocalCancellation({ order, delivery, actor = {}, options = {} }) {
    const cancellableOrderStatuses = [
      'PENDING_PAYMENT', 'PLACED', 'PAID', 'CONFIRMED',
      'SELLER_ACCEPTED', 'PREPARING', 'PROCESSING', 'READY_FOR_PICKUP'
    ];

    await prisma.$transaction(async (tx) => {
      // 1. Delivery update if present
      if (delivery) {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            status: 'CANCELLED',
            shippingLabelUrl: null,
            updatedAt: new Date()
          }
        });
      }

      // 2. Order update according to domain rules
      if (order && cancellableOrderStatuses.includes(order.status)) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            shippingLabelUrl: null,
            updatedAt: new Date()
          }
        });
      }

      // 3. Stock release using existing atomic inventory reservation release logic
      if (order?.items && order.status !== 'CANCELLED') {
        for (const item of order.items) {
          const inventoryBefore = await tx.inventory.findUnique({
            where: { productVariantId: item.productVariantId }
          });
          if (!inventoryBefore) continue;

          const stockUpdate = await tx.inventory.updateMany({
            where: {
              productVariantId: item.productVariantId,
              reservedStock: { gte: item.quantity }
            },
            data: {
              availableStock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });

          if (stockUpdate.count > 0) {
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inventoryBefore.id,
                type: 'ORDER_RELEASED',
                quantity: item.quantity,
                previousStock: inventoryBefore.availableStock,
                newStock: inventoryBefore.availableStock + item.quantity,
                reason: options.reason || 'Order cancelled before shipment creation',
                createdBy: actor.userId || actor.id || null
              }
            });
          }
        }
      }

      // 4. Audit logging
      const actorLabel = actor.role || (actor.userId === order?.customerId ? 'CUSTOMER' : 'SYSTEM');
      const logRemarks = `Order/shipment cancelled locally by ${actorLabel}. Reserved order inventory released.`;

      if (order?.id) {
        await tx.orderShipmentLog.create({
          data: {
            orderId: order.id,
            event: 'Shipment Cancelled',
            timestamp: new Date(),
            remarks: logRemarks
          }
        });

        const currentLogs = Array.isArray(order.shipmentLogs) ? order.shipmentLogs : [];
        await tx.order.update({
          where: { id: order.id },
          data: {
            shipmentLogs: [
              ...currentLogs,
              {
                timestamp: new Date().toISOString(),
                event: 'Shipment Cancelled',
                remarks: logRemarks
              }
            ]
          }
        });
      }

      // 5. Integration audit log
      await tx.integrationLog.create({
        data: {
          id: `cancel-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          service: 'Cravo',
          event: 'SHIPMENT_CANCEL_LOCAL',
          status: 'SUCCESS',
          timestamp: new Date()
        }
      });
    });

    // Outside DB transaction: orchestrate refund
    const refundResult = await this.orchestrateOrderRefund(order, options.reason || 'Order cancelled');

    // Notify customer
    if (order?.customerId) {
      notificationService.createAndEmit(
        order.customerId,
        'ORDER_STATUS_UPDATED',
        'Order Cancelled',
        `Your order #${order.orderNumber} has been cancelled.`,
        { orderId: order.id, status: 'CANCELLED' }
      ).catch(() => {});
    }

    return {
      success: true,
      localOnly: true,
      deliveryId: delivery?.id || null,
      orderId: order.id,
      status: 'CANCELLED',
      deliveryStatus: delivery ? 'CANCELLED' : null,
      orderStatus: 'CANCELLED',
      refund: refundResult ? { id: refundResult.id, status: refundResult.status } : null
    };
  },

  /**
   * Shipment Cancellation API
   * Handles both manifest-cancelled shipments via Delhivery API and local pre-manifest cancellations.
   */
  async cancelShipment(deliveryIdOrOrderId, actor = {}, options = {}) {
    if (!deliveryIdOrOrderId) {
      throw new AppError('Delivery ID or Order ID is required for cancellation', 400);
    }

    // 100% Non-COD: Reject COD parameter immediately
    if (options && 'cod' in options) {
      throw new AppError('Cravo does not support COD. The cod field cannot be supplied.', 400, 'COD_NOT_SUPPORTED');
    }

    // 1. Resolve Delivery and associated Order
    let delivery = await prisma.delivery.findFirst({
      where: {
        OR: [
          { id: deliveryIdOrOrderId },
          { orderId: deliveryIdOrOrderId }
        ]
      },
      include: {
        order: {
          include: {
            items: true,
            payments: true,
            shop: { include: { seller: true } }
          }
        }
      }
    });

    // 2. If no delivery record exists, check if orderId was passed
    if (!delivery) {
      const order = await prisma.order.findUnique({
        where: { id: deliveryIdOrOrderId },
        include: {
          items: true,
          payments: true,
          shop: { include: { seller: true } }
        }
      });

      if (!order) {
        throw new AppError('Delivery or Order not found', 404);
      }

      await this.validateCancellationAuthorization(order, actor);
      return await this.executeLocalCancellation({ order, delivery: null, actor, options });
    }

    const order = delivery.order;
    await this.validateCancellationAuthorization(order, actor);

    // 3. Inspect Delivery State Machine
    if (delivery.status === 'CANCELLED') {
      logger.info({ deliveryId: delivery.id }, 'Shipment is already cancelled. Idempotent return.');
      return {
        success: true,
        alreadyCancelled: true,
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        waybill: delivery.trackingNumber,
        status: 'CANCELLED',
        deliveryStatus: 'CANCELLED',
        orderStatus: order?.status || 'CANCELLED'
      };
    }

    // Post-pickup physical courier states: Normal cancellation strictly blocked
    if (['PICKED_UP', 'IN_TRANSIT'].includes(delivery.status)) {
      throw new AppError(
        'Shipment cannot be cancelled after courier pickup. Please initiate an RTO (Return to Origin) or NDR process.',
        400,
        'SHIPMENT_IN_TRANSIT'
      );
    }

    // Terminal or non-cancellable states
    if (['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'RTO'].includes(delivery.status)) {
      throw new AppError(
        `Shipment cannot be cancelled when delivery status is ${delivery.status}`,
        400,
        'INVALID_DELIVERY_STATUS'
      );
    }

    // Pre-manifest states (no tracking number manifested on Delhivery)
    if (['NOT_CREATED', 'PENDING', 'CREATING'].includes(delivery.status) && !delivery.trackingNumber) {
      return await this.executeLocalCancellation({ order, delivery, actor, options });
    }

    // If FAILED without AWB, local cancellation only
    if (delivery.status === 'FAILED' && !delivery.trackingNumber) {
      return await this.executeLocalCancellation({ order, delivery, actor, options });
    }

    // At this point, the shipment has a manifested Delhivery AWB
    const waybill = delivery.trackingNumber;
    if (!waybill) {
      return await this.executeLocalCancellation({ order, delivery, actor, options });
    }

    // 4. Call Delhivery Cancellation API (POST /api/p/edit with { waybill, cancellation: "true" })
    try {
      await delhiveryShipmentService.cancelShipment(waybill);
    } catch (delhiveryError) {
      if (delhiveryError.isAmbiguous) {
        await prisma.integrationLog.create({
          data: {
            id: `cancel-timeout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'SHIPMENT_CANCEL_TIMEOUT',
            status: 'AMBIGUOUS_TIMEOUT',
            timestamp: new Date()
          }
        }).catch(() => {});
      }
      throw delhiveryError;
    }

    // 5. Delhivery Cancellation Succeeded -> Execute Cravo DB Transaction
    const cancellableOrderStatuses = [
      'PENDING_PAYMENT', 'PLACED', 'PAID', 'CONFIRMED',
      'SELLER_ACCEPTED', 'PREPARING', 'PROCESSING', 'READY_FOR_PICKUP'
    ];

    try {
      await prisma.$transaction(async (tx) => {
        // A. Update Delivery state & invalidate label
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            status: 'CANCELLED',
            shippingLabelUrl: null,
            updatedAt: new Date()
          }
        });

        // B. Update Order state according to domain rules
        if (order && cancellableOrderStatuses.includes(order.status)) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              shippingLabelUrl: null,
              updatedAt: new Date()
            }
          });
        }

        // C. Release reserved stock using existing inventory reservation release logic
        if (order?.items && order.status !== 'CANCELLED') {
          for (const item of order.items) {
            const inventoryBefore = await tx.inventory.findUnique({
              where: { productVariantId: item.productVariantId }
            });
            if (!inventoryBefore) continue;

            const stockUpdate = await tx.inventory.updateMany({
              where: {
                productVariantId: item.productVariantId,
                reservedStock: { gte: item.quantity }
              },
              data: {
                availableStock: { increment: item.quantity },
                reservedStock: { decrement: item.quantity }
              }
            });

            if (stockUpdate.count > 0) {
              await tx.inventoryTransaction.create({
                data: {
                  inventoryId: inventoryBefore.id,
                  type: 'ORDER_RELEASED',
                  quantity: item.quantity,
                  previousStock: inventoryBefore.availableStock,
                  newStock: inventoryBefore.availableStock + item.quantity,
                  reason: options.reason || 'Shipment cancelled with Delhivery',
                  createdBy: actor.userId || actor.id || null
                }
              });
            }
          }
        }

        // D. Audit records (OrderShipmentLog & Order.shipmentLogs) - NO DeliveryTrackingEvent
        const actorLabel = actor.role || (actor.userId === order?.customerId ? 'CUSTOMER' : 'SYSTEM');
        const logRemarks = `Shipment cancelled on Delhivery (AWB: ${waybill}) by ${actorLabel}. Reserved order inventory released. Delhivery waybill will not be reused.`;

        await tx.orderShipmentLog.create({
          data: {
            orderId: delivery.orderId,
            event: 'Shipment Cancelled',
            timestamp: new Date(),
            awbNumber: waybill,
            shipmentId: delivery.delhiveryShipmentId,
            remarks: logRemarks
          }
        });

        const currentLogs = Array.isArray(order?.shipmentLogs) ? order.shipmentLogs : [];
        await tx.order.update({
          where: { id: delivery.orderId },
          data: {
            shipmentLogs: [
              ...currentLogs,
              {
                timestamp: new Date().toISOString(),
                event: 'Shipment Cancelled',
                awbNumber: waybill,
                shipmentId: delivery.delhiveryShipmentId,
                remarks: logRemarks
              }
            ]
          }
        });

        // E. Delhivery Waybill Lifecycle:
        // Waybill remains USED and MUST NEVER return to AVAILABLE.
        // We explicitly do NOT touch DelhiveryWaybill.status.

        // F. IntegrationLog
        await tx.integrationLog.create({
          data: {
            id: `cancel-shipment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'SHIPMENT_CANCEL',
            status: 'SUCCESS',
            timestamp: new Date()
          }
        });
      });
    } catch (dbError) {
      logger.error(
        { err: dbError.message, deliveryId: delivery.id, waybill },
        'CRITICAL: Delhivery shipment cancellation succeeded, but local DB transaction failed! Flagging for reconciliation.'
      );

      await prisma.integrationLog.create({
        data: {
          id: `cancel-reconcile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          service: 'Delhivery',
          event: 'SHIPMENT_CANCEL_DB_FAILED',
          status: 'NEEDS_RECONCILIATION',
          timestamp: new Date()
        }
      }).catch(() => {});

      try {
        const { reconciliationQueue } = await import('../jobs/reconciliation.job.js');
        if (reconciliationQueue && typeof reconciliationQueue.add === 'function') {
          await reconciliationQueue.add('reconcile-cancelled-shipment', {
            deliveryId: delivery.id,
            orderId: delivery.orderId,
            waybill,
            reason: 'POST_DELHIVERY_DB_SYNC_FAILED'
          });
        }
      } catch (queueErr) {
        logger.warn({ err: queueErr.message }, 'Could not add cancelled shipment to reconciliation queue');
      }

      const syncErr = new AppError(
        'Shipment was cancelled with Delhivery, but updating local database records failed. The shipment has been flagged for background reconciliation.',
        500,
        'POST_DELHIVERY_DB_SYNC_FAILED'
      );
      syncErr.errorCode = 'POST_DELHIVERY_DB_SYNC_FAILED';
      syncErr.meta = {
        waybill,
        cancelledOnDelhivery: true
      };
      throw syncErr;
    }

    // 6. Outside DB transaction: Orchestrate Refund
    let refundResult = null;
    try {
      refundResult = await this.orchestrateOrderRefund(order, options.reason || 'Shipment cancelled');
    } catch (refundErr) {
      logger.warn({ err: refundErr.message, orderId: delivery.orderId }, 'Refund orchestration encountered an error');
    }

    // 7. Customer Notification
    if (order?.customerId) {
      notificationService.createAndEmit(
        order.customerId,
        'ORDER_STATUS_UPDATED',
        'Shipment Cancelled',
        `Shipment for Order #${order.orderNumber} has been cancelled.`,
        { orderId: delivery.orderId, status: 'CANCELLED' }
      ).catch(() => {});
    }

    return {
      success: true,
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      waybill,
      status: 'CANCELLED',
      deliveryStatus: 'CANCELLED',
      orderStatus: 'CANCELLED',
      waybillStatus: 'USED',
      refund: refundResult ? { id: refundResult.id, status: refundResult.status } : null
    };
  },

  /**
   * E-Waybill Update API
   * Updates forward or return e-waybill associated with a manifested delivery.
   * Locking: Full operation covered by Redis/distributed lock.
   * Idempotency: Detects sequential duplicate submissions and returns early.
   * State Machine: Validated against Cravo domain boundaries.
   * Invariants: No change to AWB, inventory, order status, delivery status, stock, payment, or DeliveryTrackingEvent.
   */
  async updateEwaybill(deliveryIdOrOrderId, body = {}, actor = {}) {
    if (!deliveryIdOrOrderId) {
      throw new AppError('Delivery ID or Order ID is required to update e-waybill', 400, 'DELIVERY_ID_REQUIRED');
    }

    // 1. Initial resolution of delivery
    let delivery = null;
    if (prisma.delivery?.findFirst) {
      delivery = await prisma.delivery.findFirst({
        where: {
          OR: [
            { id: deliveryIdOrOrderId },
            { orderId: deliveryIdOrOrderId }
          ]
        },
        include: {
          order: {
            include: {
              shop: { include: { seller: true } }
            }
          }
        }
      });
    }
    if (!delivery && prisma.delivery?.findUnique) {
      delivery = await prisma.delivery.findUnique({
        where: { id: deliveryIdOrOrderId },
        include: {
          order: {
            include: {
              shop: { include: { seller: true } }
            }
          }
        }
      }).catch(() => null);
      if (!delivery) {
        delivery = await prisma.delivery.findUnique({
          where: { orderId: deliveryIdOrOrderId },
          include: {
            order: {
              include: {
                shop: { include: { seller: true } }
              }
            }
          }
        }).catch(() => null);
      }
    }

    if (!delivery) {
      throw new AppError('Delivery record not found', 404, 'DELIVERY_NOT_FOUND');
    }

    // 2. Redis Distributed Lock covering COMPLETE operation:
    // load → validate → external update → local persistence → audit
    const releaseLock = await acquireDeliveryLock(delivery.id, 'ewaybill', 30);

    try {
      // Re-fetch delivery within the lock to ensure fresh state
      let currentDelivery = null;
      if (prisma.delivery?.findUnique) {
        currentDelivery = await prisma.delivery.findUnique({
          where: { id: delivery.id },
          include: {
            order: {
              include: {
                shop: { include: { seller: true } }
              }
            }
          }
        });
      }
      if (!currentDelivery && prisma.delivery?.findFirst) {
        currentDelivery = await prisma.delivery.findFirst({
          where: { id: delivery.id },
          include: {
            order: {
              include: {
                shop: { include: { seller: true } }
              }
            }
          }
        });
      }
      if (!currentDelivery) {
        currentDelivery = delivery;
      }

      const order = currentDelivery.order;

      // 3. Authorization: ADMIN or owning SELLER
      if (!actor || (!actor.role && !actor.id)) {
        throw new AppError('Authentication required to update e-waybill', 401, 'UNAUTHENTICATED');
      }
      const isAdmin = actor.role === 'ADMIN';
      const sellerUserId = order?.shop?.seller?.userId;
      const sellerId = order?.shop?.sellerId;
      const actorUserId = actor.userId || actor.id;
      const actorSellerId = actor.sellerId;
      const isOwner = (sellerUserId && sellerUserId === actorUserId) || (sellerId && sellerId === actorSellerId);

      if (!isAdmin && !isOwner) {
        throw new AppError('Unauthorized: You do not have permission to update e-waybill for this shipment', 403, 'UNAUTHORIZED');
      }

      // 4. Input Validation (Cravo domain validation rules)
      const rawDcn = body.dcn !== undefined && body.dcn !== null ? String(body.dcn).trim() : '';
      const rawEwbn = body.ewbn !== undefined && body.ewbn !== null ? String(body.ewbn).trim() : '';

      if (!rawDcn) {
        throw new AppError('Invoice / Document Number (dcn) is required and cannot be empty.', 400, 'INVALID_DCN');
      }
      if (rawDcn.length > 50) {
        throw new AppError('Invoice / Document Number (dcn) cannot exceed 50 characters.', 400, 'INVALID_DCN');
      }
      if (!rawEwbn) {
        throw new AppError('E-Waybill Number (ewbn) is required and cannot be empty.', 400, 'INVALID_EWBN');
      }
      if (rawEwbn.length > 50) {
        throw new AppError('E-Waybill Number (ewbn) cannot exceed 50 characters.', 400, 'INVALID_EWBN');
      }

      // 5. Domain State Machine Boundary
      // Must have manifested tracking number
      if (!currentDelivery.trackingNumber) {
        throw new AppError('Cannot update e-waybill for an unmanifested shipment without a waybill number.', 400, 'SHIPMENT_NOT_MANIFESTED');
      }

      // Terminal blocked states in Cravo domain
      if (currentDelivery.status === 'CANCELLED') {
        throw new AppError('Cannot update e-waybill for a cancelled shipment.', 400, 'SHIPMENT_CANCELLED');
      }
      if (currentDelivery.status === 'DELIVERED') {
        throw new AppError('Cannot update e-waybill for an already delivered shipment.', 400, 'SHIPMENT_ALREADY_DELIVERED');
      }

      const ALLOWED_FORWARD_STATES = [
        'CREATED', 'BOOKED', 'PICKUP_SCHEDULED', 'READY_FOR_PICKUP',
        'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NDR'
      ];
      const ALLOWED_RETURN_STATES = ['RTO', 'RETURNED'];

      const isReturnFlow = ALLOWED_RETURN_STATES.includes(currentDelivery.status);
      const isForwardFlow = ALLOWED_FORWARD_STATES.includes(currentDelivery.status);

      if (!isReturnFlow && !isForwardFlow) {
        throw new AppError(`E-Waybill updates are not permitted for shipment status: ${currentDelivery.status}`, 400, 'INVALID_DELIVERY_STATUS');
      }

      const flow = isReturnFlow ? 'RETURN' : 'FORWARD';
      const waybill = currentDelivery.trackingNumber;

      // 6. Sequential Duplicate Submission Check (Idempotency)
      const currentEwbOnModel = isReturnFlow ? currentDelivery.returnEwaybillNumber : currentDelivery.ewaybillNumber;
      if (currentEwbOnModel === rawEwbn) {
        logger.info({ deliveryId: currentDelivery.id, waybill, ewbn: rawEwbn, flow }, 'Sequential duplicate e-waybill update detected. Returning idempotent success.');
        return {
          success: true,
          alreadyUpdated: true,
          deliveryId: currentDelivery.id,
          orderId: currentDelivery.orderId,
          waybill,
          flow,
          dcn: rawDcn,
          ewbn: rawEwbn,
          ewaybillNumber: isReturnFlow ? currentDelivery.ewaybillNumber : rawEwbn,
          returnEwaybillNumber: isReturnFlow ? rawEwbn : currentDelivery.returnEwaybillNumber,
          message: `${flow === 'RETURN' ? 'Return ' : ''}E-Waybill is already up to date for this shipment.`
        };
      }

      // 7. External Delhivery Call (PUT /api/rest/ewaybill/{waybill}/)
      try {
        await delhiveryShipmentService.updateEwaybill({
          waybill,
          dcn: rawDcn,
          ewbn: rawEwbn
        });
      } catch (delhiveryError) {
        if (delhiveryError.isAmbiguous) {
          await prisma.integrationLog.create({
            data: {
              id: `ewb-timeout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              service: 'Delhivery',
              event: 'EWAYBILL_UPDATE_TIMEOUT',
              status: 'AMBIGUOUS_TIMEOUT',
              timestamp: new Date()
            }
          }).catch(() => {});

          try {
            const { reconciliationQueue } = await import('../jobs/reconciliation.job.js');
            if (reconciliationQueue && typeof reconciliationQueue.add === 'function') {
              await reconciliationQueue.add('reconcile-ewaybill', {
                deliveryId: currentDelivery.id,
                orderId: currentDelivery.orderId,
                waybill,
                dcn: rawDcn,
                ewbn: rawEwbn,
                flow,
                reason: 'AMBIGUOUS_TIMEOUT'
              });
            }
          } catch (queueErr) {
            logger.warn({ err: queueErr.message }, 'Failed to enqueue ambiguous ewaybill update to reconciliationQueue');
          }
        }
        throw delhiveryError;
      }

      // 8. Local Database Update & Audit Logging
      try {
        const updateData = isReturnFlow
          ? { returnEwaybillNumber: rawEwbn, updatedAt: new Date() }
          : { ewaybillNumber: rawEwbn, updatedAt: new Date() };

        await prisma.delivery.update({
          where: { id: currentDelivery.id },
          data: updateData
        });

        // If order does not have an invoiceNumber, record it
        if (order && !order.invoiceNumber) {
          await prisma.order.update({
            where: { id: order.id },
            data: { invoiceNumber: rawDcn }
          }).catch(() => {});
        }

        // Audit Logging (OrderShipmentLog + Order.shipmentLogs) - NO DeliveryTrackingEvent!
        const actorLabel = actor.role || 'USER';
        const remarks = `${flow === 'RETURN' ? 'Return ' : ''}E-Waybill updated to ${rawEwbn} (Doc: ${rawDcn}) on Delhivery by ${actorLabel}.`;

        if (currentDelivery.orderId) {
          await prisma.orderShipmentLog.create({
            data: {
              orderId: currentDelivery.orderId,
              event: 'E-Waybill Updated',
              timestamp: new Date(),
              awbNumber: waybill,
              shipmentId: currentDelivery.delhiveryShipmentId,
              remarks
            }
          }).catch(() => {});

          const currentLogs = Array.isArray(order?.shipmentLogs) ? order.shipmentLogs : [];
          await prisma.order.update({
            where: { id: currentDelivery.orderId },
            data: {
              shipmentLogs: [
                ...currentLogs,
                {
                  timestamp: new Date().toISOString(),
                  event: 'E-Waybill Updated',
                  awbNumber: waybill,
                  shipmentId: currentDelivery.delhiveryShipmentId,
                  remarks
                }
              ]
            }
          }).catch(() => {});
        }

        await prisma.integrationLog.create({
          data: {
            id: `ewb-update-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'EWAYBILL_UPDATE',
            status: 'SUCCESS',
            timestamp: new Date()
          }
        }).catch(() => {});

        logger.info(
          { deliveryId: currentDelivery.id, waybill, ewbn: rawEwbn, flow },
          'Successfully updated and persisted Delhivery e-waybill'
        );

        return {
          success: true,
          deliveryId: currentDelivery.id,
          orderId: currentDelivery.orderId,
          waybill,
          flow,
          dcn: rawDcn,
          ewbn: rawEwbn,
          ewaybillNumber: isReturnFlow ? currentDelivery.ewaybillNumber : rawEwbn,
          returnEwaybillNumber: isReturnFlow ? rawEwbn : currentDelivery.returnEwaybillNumber,
          updatedAt: new Date()
        };
      } catch (dbError) {
        logger.error(
          { err: dbError.message, deliveryId: currentDelivery.id, waybill, ewbn: rawEwbn },
          'CRITICAL: Delhivery e-waybill update succeeded, but local DB update failed! Flagging for reconciliation.'
        );

        await prisma.integrationLog.create({
          data: {
            id: `ewb-reconcile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            service: 'Delhivery',
            event: 'EWAYBILL_UPDATE_DB_FAILED',
            status: 'NEEDS_RECONCILIATION',
            timestamp: new Date()
          }
        }).catch(() => {});

        try {
          const { reconciliationQueue } = await import('../jobs/reconciliation.job.js');
          if (reconciliationQueue && typeof reconciliationQueue.add === 'function') {
            await reconciliationQueue.add('reconcile-ewaybill', {
              deliveryId: currentDelivery.id,
              orderId: currentDelivery.orderId,
              waybill,
              dcn: rawDcn,
              ewbn: rawEwbn,
              flow,
              reason: 'POST_DELHIVERY_DB_SYNC_FAILED'
            });
          }
        } catch (queueErr) {
          logger.warn({ err: queueErr.message }, 'Failed to enqueue to reconciliationQueue');
        }

        const syncErr = new AppError(
          'E-Waybill was successfully updated with Delhivery, but updating local database records failed. The shipment has been flagged for background reconciliation.',
          500,
          'POST_DELHIVERY_DB_SYNC_FAILED'
        );
        syncErr.errorCode = 'POST_DELHIVERY_DB_SYNC_FAILED';
        syncErr.meta = {
          waybill,
          ewbn: rawEwbn,
          dcn: rawDcn,
          flow,
          updatedOnDelhivery: true
        };
        throw syncErr;
      }
    } finally {
      await releaseLock();
    }
  },

  // ─── SHIPMENT TRACKING ───────────────────────────────────────────────────────

  /**
   * Delhivery status strings → Cravo DeliveryStatus enum.
   * Keys are the exact strings Delhivery sends (case-sensitive where possible).
   */
  _statusMap: {
    'Pending':            'PENDING',
    'In Transit':         'IN_TRANSIT',
    'Dispatched':         'IN_TRANSIT',
    'Out for Delivery':   'OUT_FOR_DELIVERY',
    'Delivered':          'DELIVERED',
    'RTO':                'RTO',
    'RTO Initiated':      'RTO',
    'RTO In Transit':     'RTO',
    'Return to Origin':   'RTO',
    'Returned':           'RETURNED',
    'Lost':               'LOST',
    'Cancelled':          'CANCELLED',
    'Picked Up':          'PICKED_UP',
    'Pickup':             'PICKED_UP',
    'Manifested':         'CREATED',
  },

  /**
   * Status rank for state machine enforcement.
   * Higher number = more advanced state. Status never regresses.
   */
  _statusRank: {
    'NOT_CREATED':      0,
    'CREATING':         1,
    'FAILED':           1,
    'PENDING':          2,
    'CREATED':          3,
    'BOOKED':           4,
    'PICKUP_SCHEDULED': 5,
    'PICKED_UP':        6,
    'IN_TRANSIT':       7,
    'OUT_FOR_DELIVERY': 8,
    'DELIVERED':        9,
    'RTO':              7,
    'RETURNED':         9,
    'LOST':             9,
    'CANCELLED':       10,
  },

  /**
   * Normalizes a raw Delhivery scan into a canonical event object with a
   * deterministic SHA-256 fingerprint. Used by both webhook and polling paths
   * to guarantee identical fingerprints for the same physical scan.
   *
   * @param {string} awb
   * @param {string} rawStatus  - Delhivery scan status string (e.g. "Delivered")
   * @param {string} description - Location / instructions text
   * @param {string|Date} eventTime - ISO 8601 timestamp or Date
   * @param {string} [statusType] - Delhivery StatusType (e.g., UD, RT)
   * @param {string} [nslCode] - Delhivery NSLCode
   * @returns {{ status, description, eventTime, fingerprint, nslCode }}
   */
  normalizeTrackingEvent(awb, rawStatus, description, eventTime, statusType = '', nslCode = '') {
    let normalizedStatus = this._statusMap[rawStatus] ?? 'IN_TRANSIT';
    
    // StatusType specific overrides (e.g., UD = forward, RT = return, PU = reverse pickup)
    if (statusType === 'RT') {
      if (rawStatus === 'In Transit' || rawStatus === 'Pending' || rawStatus === 'Dispatched') {
         normalizedStatus = 'RTO';
      }
    } else if (statusType === 'PU' || statusType === 'PP') {
       if (rawStatus === 'Open' || rawStatus === 'Scheduled' || rawStatus === 'Pending') {
          normalizedStatus = 'PICKUP_SCHEDULED';
       } else if (rawStatus === 'Dispatched' || rawStatus === 'In Transit') {
          normalizedStatus = 'IN_TRANSIT'; // or whatever reverse transit maps to, keeping IN_TRANSIT for now
       } else if (rawStatus === 'Cancelled' || rawStatus === 'Closed') {
          normalizedStatus = 'CANCELLED';
       }
    }

    const normalizedDescription = (description || '').trim();

    // Canonical timestamp: always use ISO 8601 UTC string
    const ts = eventTime instanceof Date
      ? eventTime.toISOString()
      : (typeof eventTime === 'string' ? new Date(eventTime).toISOString() : new Date(0).toISOString());

    // Deterministic fingerprint — same formula for webhook and polling
    // DO NOT ADD nslCode to fingerprint as per instructions unless strictly required.
    const fingerprint = createHash('sha256')
      .update(`${awb}|${normalizedStatus}|${normalizedDescription}|${ts}`)
      .digest('hex');

    return {
      status: normalizedStatus,
      description: normalizedDescription,
      eventTime: new Date(ts),
      fingerprint,
      nslCode
    };
  },

  /**
   * Persists a normalized tracking event and (conditionally) advances
   * Delivery.status according to the state machine rank.
   *
   * @param {object} delivery - Prisma delivery row (must include .order)
   * @param {{ status, description, eventTime, fingerprint, nslCode }} normalizedEvent
   * @param {boolean} isCurrentStatus - true = may advance delivery status
   */
  async processTrackingUpdate(delivery, normalizedEvent, isCurrentStatus) {
    const { status, description, eventTime, fingerprint, nslCode } = normalizedEvent;
    const currentRank = this._statusRank[delivery.status] ?? 0;
    const newRank = this._statusRank[status] ?? 0;

    // ... [existing logic remains untouched]
    const shouldUpdateStatus = isCurrentStatus && (newRank > currentRank);

    await prisma.$transaction(async (tx) => {
      // Always insert the event — skipDuplicates handles concurrent/duplicate ingestion
      await tx.deliveryTrackingEvent.createMany({
        data: [{ deliveryId: delivery.id, status, description, eventTime, fingerprint }],
        skipDuplicates: true
      });

      // Only advance delivery status if:
      //  1. caller signals this is the current (most-recent) status, AND
      //  2. new rank is strictly greater than existing rank
      if (isCurrentStatus && newRank > currentRank) {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: { status, updatedAt: new Date() }
        });

        // Mirror to Order if needed
        if (delivery.order?.id) {
          const orderStatusMap = {
            'DELIVERED':        'DELIVERED',
            'CANCELLED':        'CANCELLED',
            'RETURNED':         'RETURNED',
            'RTO':              'RETURNED',
          };
          const orderStatus = orderStatusMap[status];
          if (orderStatus) {
            await tx.order.update({
              where: { id: delivery.order.id },
              data: { status: orderStatus, updatedAt: new Date() }
            }).catch(() => {});
          }
        }
      }
    });
  },



  /**
   * Public tracking endpoint — accepts AWB or order number.
   * Strips all PII from the response before returning.
   */
  async getPublicTracking(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      throw new AppError('Tracking identifier is required', 400);
    }

    const clean = identifier.trim();

    // Try to find by tracking number (AWB) first, then by order number
    let delivery = await prisma.delivery.findFirst({
      where: { trackingNumber: clean },
      include: {
        trackingEvents: { orderBy: { eventTime: 'asc' } },
        order: { select: { orderNumber: true, status: true } }
      }
    });

    if (!delivery) {
      // Lookup by order number: Order → Delivery
      const order = await prisma.order.findFirst({
        where: { orderNumber: clean },
        select: { id: true, orderNumber: true, status: true }
      });
      if (order) {
        delivery = await prisma.delivery.findFirst({
          where: { orderId: order.id },
          include: {
            trackingEvents: { orderBy: { eventTime: 'asc' } },
            order: { select: { orderNumber: true, status: true } }
          }
        });
      }
    }

    if (!delivery) {
      throw new AppError('No shipment found for the provided tracking identifier', 404);
    }

    // PII-stripped public response — never expose customer details or internal IDs
    return {
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      orderNumber: delivery.order?.orderNumber,
      events: (delivery.trackingEvents || []).map((ev) => ({
        status: ev.status,
        description: ev.description,
        eventTime: ev.eventTime
      }))
    };
  },

  /**
   * Processes an inbound Delhivery webhook event.
   * Uses the same normalizeTrackingEvent → processTrackingUpdate pipeline as polling,
   * guaranteeing that webhook and polling produce identical fingerprints for the same scan.
   */
  async handleWebhookEvent(payload) {
    if (!payload || !payload.Shipment) {
      logger.warn({ payload }, '[handleWebhookEvent] Webhook payload missing Shipment root — skipping');
      return;
    }

    const shipment = payload.Shipment;
    const awb = shipment.AWB;
    const statusObj = shipment.Status || {};
    
    const rawStatus = statusObj.Status || '';
    const statusType = statusObj.StatusType || '';
    const description = statusObj.Instructions || statusObj.StatusLocation || '';
    const eventTime = statusObj.StatusDateTime || shipment.PickUpDate || new Date().toISOString();
    const nslCode = shipment.NSLCode || '';

    if (!awb) {
      logger.warn({ payload }, '[handleWebhookEvent] Webhook payload missing AWB — skipping');
      return;
    }

    // trackingNumber has @unique — use findUnique for O(1) lookup
    const delivery = await prisma.delivery.findUnique({
      where: { trackingNumber: String(awb) },
      include: { order: true }
    });

    if (!delivery) {
      try {
        await prisma.integrationLog.create({
          data: {
            direction: 'INBOUND',
            service: 'DELHIVERY',
            endpoint: 'WEBHOOK',
            requestPayload: { awb, rawStatus, statusType, timestamp: eventTime },
            responsePayload: { error: 'Unknown AWB' },
            status: 'SUCCESS', // Considered safely acknowledged
            metadata: { issue: 'DELHIVERY_WEBHOOK_UNKNOWN_AWB' }
          }
        });
      } catch (e) {
        logger.error({ err: e.message, awb }, 'Failed to write IntegrationLog for unknown webhook AWB');
      }
      logger.warn({ awb }, '[handleWebhookEvent] No delivery found for webhook AWB — safely ignored');
      return;
    }

    const normalizedEvent = this.normalizeTrackingEvent(awb, rawStatus, description, eventTime, statusType, nslCode);
    
    // Webhook delivers the latest known status — treat as current
    await this.processTrackingUpdate(delivery, normalizedEvent, true);

    logger.info({ awb, status: normalizedEvent.status, fingerprint: normalizedEvent.fingerprint }, '[handleWebhookEvent] Processed webhook tracking event');
  }
};
