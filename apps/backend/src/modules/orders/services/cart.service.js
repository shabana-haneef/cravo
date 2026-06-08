import { cartRepository } from '../repositories/cart.repository.js';
import { cartItemRepository } from '../repositories/cartItem.repository.js';
import { productVariantRepository } from '../../products/repositories/productVariant.repository.js';
import { inventoryRepository } from '../../products/repositories/inventory.repository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';

export const cartService = {
  async getCart(userId) {
    let cart = await cartRepository.getByUserId(userId);
    if (!cart) {
      cart = await cartRepository.upsert(userId);
      cart = await cartRepository.getByUserId(userId);
    }

    let subtotal = 0;
    let totalItems = 0;

    const validatedItems = cart.items.map(item => {
      const price = item.productVariant.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.productVariantId,
        productName: item.product.name,
        variantName: item.productVariant.name,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal
      };
    });

    return {
      id: cart.id,
      shopId: cart.shopId,
      shop: cart.shop ? { name: cart.shop.name, slug: cart.shop.slug } : null,
      items: validatedItems,
      summary: {
        subtotal,
        totalItems,
        estimatedTotal: subtotal // Delivery calculated at checkout
      }
    };
  },

  async addItem(userId, variantId, quantity) {
    // 1. Validate Variant & Product
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!variant || !variant.isActive) throw new AppError("Product variant not available", 400);
    if (variant.product.status !== 'APPROVED') throw new AppError("Product not available", 400);

    const targetShopId = variant.product.shopId;

    // 2. Validate Inventory
    const inventory = await inventoryRepository.findByVariantId(variantId);
    if (!inventory || inventory.availableStock < quantity) {
      throw new AppError(`Only ${inventory?.availableStock || 0} items available in stock`, 400);
    }

    // 3. Get or Create Cart & Enforce Single Shop Rule
    let cart = await cartRepository.getByUserId(userId);
    if (!cart) {
      cart = await cartRepository.upsert(userId, targetShopId);
    } else {
      if (cart.shopId && cart.shopId !== targetShopId && cart.items.length > 0) {
        throw new AppError("Your cart already contains items from a different shop. Please clear your cart first.", 400);
      }
      if (!cart.shopId) {
        cart = await cartRepository.upsert(userId, targetShopId);
      }
    }

    // 4. Upsert Item
    // Check if item already exists to validate total quantity vs stock
    const existingItem = cart.items.find(i => i.productVariantId === variantId);
    const newTotalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (inventory.availableStock < newTotalQuantity) {
      throw new AppError(`Cannot add more. Only ${inventory.availableStock} items available in total.`, 400);
    }

    await cartItemRepository.upsertItem(cart.id, variant.productId, variantId, newTotalQuantity);
    logger.info({ userId, variantId, quantity }, 'Item added to cart');

    return this.getCart(userId);
  },

  async updateItemQuantity(userId, itemId, quantity) {
    const cart = await cartRepository.getByUserId(userId);
    if (!cart) throw new AppError("Cart not found", 404);

    const item = cart.items.find(i => i.id === itemId);
    if (!item) throw new AppError("Item not found in cart", 404);

    const inventory = await inventoryRepository.findByVariantId(item.productVariantId);
    if (!inventory || inventory.availableStock < quantity) {
      throw new AppError(`Only ${inventory?.availableStock || 0} items available in stock`, 400);
    }

    await cartItemRepository.updateQuantity(itemId, quantity);
    logger.info({ userId, itemId, quantity }, 'Cart item quantity updated');

    return this.getCart(userId);
  },

  async removeItem(userId, itemId) {
    const cart = await cartRepository.getByUserId(userId);
    if (!cart) throw new AppError("Cart not found", 404);

    const item = cart.items.find(i => i.id === itemId);
    if (!item) throw new AppError("Item not found in cart", 404);

    await cartItemRepository.removeItem(itemId);
    
    // If cart is empty after removal, clear shopId
    if (cart.items.length === 1) {
      await cartRepository.clearShopId(cart.id);
    }

    logger.info({ userId, itemId }, 'Cart item removed');

    return this.getCart(userId);
  },

  async clearCart(userId) {
    await cartRepository.clearCart(userId);
    logger.info({ userId }, 'Cart cleared');
    return this.getCart(userId);
  }
};
