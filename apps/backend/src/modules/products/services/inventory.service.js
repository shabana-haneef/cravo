import { inventoryRepository } from '../repositories/inventory.repository.js';
import { inventoryTransactionRepository } from '../repositories/inventoryTransaction.repository.js';
import { productService } from './product.service.js';
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
      // Re-fetch with lock in real PG environment if possible, 
      // but Prisma doesn't natively support pessimistic locks smoothly without raw query.
      // We will do a generic update and verify.
      
      const currentInventory = await inventoryRepository.findByVariantId(variantId, tx);
      
      let type = 'MANUAL_ADJUSTMENT';
      if (quantity > 0) type = 'STOCK_IN';
      if (quantity < 0) type = 'STOCK_OUT';

      const newStock = currentInventory.availableStock + quantity;
      
      if (newStock < 0) {
        throw new AppError(`Cannot reduce stock by ${Math.abs(quantity)}. Only ${currentInventory.availableStock} available.`, 400);
      }

      const updatedInventory = await inventoryRepository.update(currentInventory.id, {
        availableStock: newStock
      }, tx);

      await inventoryTransactionRepository.create({
        inventoryId: currentInventory.id,
        type,
        quantity: Math.abs(quantity),
        previousStock: currentInventory.availableStock,
        newStock,
        reason: reason || 'Manual adjustment',
        createdBy: userId
      }, tx);

      logger.info({ variantId, newStock }, 'Stock adjusted manually');

      if (newStock <= updatedInventory.lowStockThreshold) {
        logger.warn({ variantId, newStock }, 'Low stock alert');
        // Trigger notification service here
      }

      return updatedInventory;
    });
  },

  async getHistory(userId, variantId, page = 1, limit = 20) {
    await this.getInventory(userId, variantId); // Auth check
    const skip = (page - 1) * limit;
    return inventoryTransactionRepository.findHistoryByVariantId(variantId, skip, limit);
  },

  // Reusable system methods (not exposed to sellers via direct HTTP)
  async reserveStock(variantId, quantity) {
    return prisma.$transaction(async (tx) => {
      const inventory = await inventoryRepository.findByVariantId(variantId, tx);
      if (!inventory) throw new AppError("Inventory not found", 404);
      
      if (inventory.availableStock < quantity) {
        throw new AppError("Insufficient stock", 400);
      }

      const newAvailable = inventory.availableStock - quantity;
      const newReserved = inventory.reservedStock + quantity;

      const updated = await inventoryRepository.update(inventory.id, {
        availableStock: newAvailable,
        reservedStock: newReserved
      }, tx);

      await inventoryTransactionRepository.create({
        inventoryId: inventory.id,
        type: 'ORDER_RESERVED',
        quantity,
        previousStock: inventory.availableStock,
        newStock: newAvailable,
        reason: 'Order placed'
      }, tx);

      return updated;
    });
  },

  async releaseStock(variantId, quantity) {
    return prisma.$transaction(async (tx) => {
      const inventory = await inventoryRepository.findByVariantId(variantId, tx);
      if (!inventory) throw new AppError("Inventory not found", 404);
      
      if (inventory.reservedStock < quantity) {
        throw new AppError("Cannot release more than reserved stock", 400);
      }

      const newAvailable = inventory.availableStock + quantity;
      const newReserved = inventory.reservedStock - quantity;

      const updated = await inventoryRepository.update(inventory.id, {
        availableStock: newAvailable,
        reservedStock: newReserved
      }, tx);

      await inventoryTransactionRepository.create({
        inventoryId: inventory.id,
        type: 'ORDER_RELEASED',
        quantity,
        previousStock: inventory.availableStock,
        newStock: newAvailable,
        reason: 'Order cancelled/released'
      }, tx);

      return updated;
    });
  },

  async deductStock(variantId, quantity) {
    return prisma.$transaction(async (tx) => {
      const inventory = await inventoryRepository.findByVariantId(variantId, tx);
      if (!inventory) throw new AppError("Inventory not found", 404);
      
      if (inventory.reservedStock < quantity) {
        throw new AppError("Reserved stock mismatch", 400);
      }

      const newReserved = inventory.reservedStock - quantity;

      const updated = await inventoryRepository.update(inventory.id, {
        reservedStock: newReserved
      }, tx);

      await inventoryTransactionRepository.create({
        inventoryId: inventory.id,
        type: 'ORDER_COMPLETED',
        quantity,
        previousStock: inventory.availableStock,
        newStock: inventory.availableStock,
        reason: 'Order completed and shipped'
      }, tx);

      return updated;
    });
  }
};
