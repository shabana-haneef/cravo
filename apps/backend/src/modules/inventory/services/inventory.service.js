import { inventoryRepository } from '../repositories/inventory.repository.js';
import { inventoryTransactionRepository } from '../repositories/inventoryTransaction.repository.js';
import { productService } from '../../products/services/product.service.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';

export const inventoryService = {
  async getInventory(userId, variantId) {
    const inventory = await inventoryRepository.findByVariantIdWithProduct(variantId);
    if (!inventory) throw new AppError("Inventory not found", 404);

    // Enforce IDOR protection: only the owner of the product can view its inventory details directly
    await productService.getMyProductById(userId, inventory.productVariant.productId);

    return inventory;
  },

  async adjustStock(userId, variantId, quantity, reason) {
    if (quantity === 0) throw new AppError("Quantity cannot be 0", 400);

    const inventory = await this.getInventory(userId, variantId);

    return prisma.$transaction(async (tx) => {
      let type = 'MANUAL_ADJUSTMENT';
      if (quantity > 0) type = 'STOCK_IN';
      if (quantity < 0) type = 'STOCK_OUT';

      const updateData = { availableStock: { increment: quantity } };
      const whereClause = { id: inventory.id };
      
      if (quantity < 0) {
        whereClause.availableStock = { gte: Math.abs(quantity) };
      }

      const updateResult = await tx.inventory.updateMany({
        where: whereClause,
        data: updateData
      });

      if (updateResult.count === 0) {
        throw new AppError(`Cannot reduce stock by ${Math.abs(quantity)}. Insufficient available stock.`, 400);
      }

      // Re-fetch for logging and limits
      const updatedInventory = await tx.inventory.findUnique({ where: { id: inventory.id } });

      await inventoryTransactionRepository.create({
        inventoryId: inventory.id,
        type,
        quantity: Math.abs(quantity),
        previousStock: inventory.availableStock,
        newStock: updatedInventory.availableStock,
        reason: reason || 'Manual adjustment',
        createdBy: userId
      }, tx);

      logger.info({ variantId, newStock: updatedInventory.availableStock }, 'Stock adjusted manually');

      if (updatedInventory.availableStock <= updatedInventory.lowStockThreshold) {
        logger.warn({ variantId, newStock: updatedInventory.availableStock }, 'Low stock alert');
        // Trigger notification service here
      }

      return updatedInventory;
    });
  },

  async getHistory(userId, variantId, page = 1, limit = 20) {
    await this.getInventory(userId, variantId); // Auth check
    return inventoryTransactionRepository.findHistoryByVariantId(variantId, page, limit);
  },

  // Reusable system methods (not exposed to sellers via direct HTTP)
  async reserveStock(variantId, quantity) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.inventory.updateMany({
        where: { 
          productVariantId: variantId,
          availableStock: { gte: quantity }
        },
        data: {
          availableStock: { decrement: quantity },
          reservedStock: { increment: quantity }
        }
      });
      
      if (updateResult.count === 0) {
        throw new AppError("Insufficient stock or inventory not found", 400);
      }

      const inventory = await tx.inventory.findUnique({ where: { productVariantId: variantId } });

      await inventoryTransactionRepository.create({
        inventoryId: inventory.id,
        type: 'ORDER_RESERVED',
        quantity,
        previousStock: inventory.availableStock + quantity,
        newStock: inventory.availableStock,
        reason: 'Order placed'
      }, tx);

      return inventory;
    });
  },

  async releaseStock(variantId, quantity) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.inventory.updateMany({
        where: { 
          productVariantId: variantId,
          reservedStock: { gte: quantity }
        },
        data: {
          availableStock: { increment: quantity },
          reservedStock: { decrement: quantity }
        }
      });
      
      if (updateResult.count === 0) {
        throw new AppError("Cannot release more than reserved stock or inventory not found", 400);
      }

      const inventory = await tx.inventory.findUnique({ where: { productVariantId: variantId } });

      await inventoryTransactionRepository.create({
        inventoryId: inventory.id,
        type: 'ORDER_RELEASED',
        quantity,
        previousStock: inventory.availableStock - quantity,
        newStock: inventory.availableStock,
        reason: 'Order cancelled/released'
      }, tx);

      return inventory;
    });
  },

  async deductStock(variantId, quantity) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.inventory.updateMany({
        where: { 
          productVariantId: variantId,
          reservedStock: { gte: quantity }
        },
        data: {
          reservedStock: { decrement: quantity }
        }
      });
      
      if (updateResult.count === 0) {
        throw new AppError("Reserved stock mismatch or inventory not found", 400);
      }

      const inventory = await tx.inventory.findUnique({ where: { productVariantId: variantId } });

      await inventoryTransactionRepository.create({
        inventoryId: inventory.id,
        type: 'ORDER_COMPLETED',
        quantity,
        previousStock: inventory.availableStock,
        newStock: inventory.availableStock,
        reason: 'Order completed and shipped'
      }, tx);

      return inventory;
    });
  }
};
