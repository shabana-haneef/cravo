import cron from 'node-cron';
import prisma from '../../../lib/prisma.js';
import { orderSettingsService } from '../../admin/services/orderSettings.service.js';
import { deliverySettingsService } from '../../admin/services/deliverySettings.service.js';
import { logger } from '../../../shared/services/logger.js';

export const initOrderMaintenanceJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Starting scheduled order maintenance job');

    try {
      const settings = await orderSettingsService.get();

      // 1. Auto Cancel Unconfirmed Orders ( remain PLACED after X minutes )
      const cancelCutoff = new Date(Date.now() - settings.autoCancelUnconfirmedMins * 60 * 1000);
      const unconfirmedOrders = await prisma.order.findMany({
        where: {
          status: 'PLACED',
          createdAt: { lt: cancelCutoff }
        },
        include: { items: true }
      });

      for (const order of unconfirmedOrders) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'CANCELLED' }
            });

            // Release stock
            for (const item of order.items) {
              const inventory = await tx.inventory.findUnique({
                where: { productVariantId: item.productVariantId }
              });
              if (inventory) {
                await tx.inventory.update({
                  where: { id: inventory.id },
                  data: {
                    availableStock: inventory.availableStock + item.quantity,
                    reservedStock: inventory.reservedStock - item.quantity
                  }
                });

                await tx.inventoryTransaction.create({
                  data: {
                    inventoryId: inventory.id,
                    type: 'ORDER_RELEASED',
                    quantity: item.quantity,
                    previousStock: inventory.availableStock,
                    newStock: inventory.availableStock + item.quantity,
                    reason: 'Auto cancelled unconfirmed order timeout',
                    createdBy: 'SYSTEM'
                  }
                });
              }
            }
          });
          logger.info({ orderId: order.id }, 'Order auto-cancelled due to confirmation timeout');
        } catch (err) {
          logger.error({ err: err.message, orderId: order.id }, 'Failed to auto-cancel order');
        }
      }

      // 1.5. Auto Cancel Unfulfilled Orders (remain unfulfilled after X days)
      const deliverySettings = await deliverySettingsService.get();
      if (deliverySettings.autoCancelUnfulfilledOrders) {
        const unfulfilledCutoff = new Date(Date.now() - deliverySettings.autoCancelWindowDays * 24 * 60 * 60 * 1000);
        const unfulfilledOrders = await prisma.order.findMany({
          where: {
            status: { in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] },
            updatedAt: { lt: unfulfilledCutoff }
          },
          include: { items: true }
        });

        for (const order of unfulfilledOrders) {
          try {
            await prisma.$transaction(async (tx) => {
              await tx.order.update({
                where: { id: order.id },
                data: { status: 'CANCELLED' }
              });

              // Release stock
              for (const item of order.items) {
                const inventory = await tx.inventory.findUnique({
                  where: { productVariantId: item.productVariantId }
                });
                if (inventory) {
                  await tx.inventory.update({
                    where: { id: inventory.id },
                    data: {
                      availableStock: inventory.availableStock + item.quantity,
                      reservedStock: inventory.reservedStock - item.quantity
                    }
                  });

                  await tx.inventoryTransaction.create({
                    data: {
                      inventoryId: inventory.id,
                      type: 'ORDER_RELEASED',
                      quantity: item.quantity,
                      previousStock: inventory.availableStock,
                      newStock: inventory.availableStock + item.quantity,
                      reason: 'Auto cancelled: Fulfillment timeout',
                      createdBy: 'SYSTEM'
                    }
                  });
                }
              }
            });
            logger.info({ orderId: order.id }, 'Order auto-cancelled due to fulfillment timeout');
          } catch (err) {
            logger.error({ err: err.message, orderId: order.id }, 'Failed to auto-cancel unfulfilled order');
          }
        }
      }

      // 2. Auto Complete Delivered Orders ( mark DELIVERED orders as completed after X days )
      // (Since there is no COMPLETED state in OrderStatus enum, we log completion tracking)
      const completeCutoff = new Date(Date.now() - settings.autoCompleteDeliveredDays * 24 * 60 * 60 * 1000);
      const completedOrdersCount = await prisma.order.count({
        where: {
          status: 'DELIVERED',
          updatedAt: { lt: completeCutoff }
        }
      });
      if (completedOrdersCount > 0) {
        logger.info(`Auto-completed delivered order checks. Found ${completedOrdersCount} orders matching completion age.`);
      }

      // 3. Auto Expire Seller Acceptance
      const sellerCutoff = new Date(Date.now() - settings.autoExpireSellerAcceptanceMins * 60 * 1000);
      const unacceptedOrders = await prisma.order.findMany({
        where: {
          status: 'PLACED',
          createdAt: { lt: sellerCutoff }
        },
        include: { items: true }
      });

      for (const order of unacceptedOrders) {
        try {
          if (settings.sellerAcceptanceAction === 'CANCEL') {
            await prisma.$transaction(async (tx) => {
              await tx.order.update({
                where: { id: order.id },
                data: { status: 'CANCELLED' }
              });

              // Release stock
              for (const item of order.items) {
                const inventory = await tx.inventory.findUnique({
                  where: { productVariantId: item.productVariantId }
                });
                if (inventory) {
                  await tx.inventory.update({
                    where: { id: inventory.id },
                    data: {
                      availableStock: inventory.availableStock + item.quantity,
                      reservedStock: inventory.reservedStock - item.quantity
                    }
                  });

                  await tx.inventoryTransaction.create({
                    data: {
                      inventoryId: inventory.id,
                      type: 'ORDER_RELEASED',
                      quantity: item.quantity,
                      previousStock: inventory.availableStock,
                      newStock: inventory.availableStock + item.quantity,
                      reason: 'Auto cancelled: Seller acceptance timeout',
                      createdBy: 'SYSTEM'
                    }
                  });
                }
              }
            });
            logger.info({ orderId: order.id }, 'Order auto-cancelled due to seller acceptance timeout');
          } else {
            // ESCALATE
            logger.warn({ orderId: order.id }, 'Order escalated due to seller acceptance timeout');
          }
        } catch (err) {
          logger.error({ err: err.message, orderId: order.id }, 'Failed to expire seller acceptance for order');
        }
      }

    } catch (error) {
      logger.error({ err: error.message }, 'Order maintenance job failed');
    }
  });
};
