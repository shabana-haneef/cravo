import prisma from '../../../lib/prisma.js';

export const cartItemRepository = {
  async upsertItem(cartId, productId, variantId, quantity) {
    return prisma.cartItem.upsert({
      where: {
        cartId_productVariantId: {
          cartId,
          productVariantId: variantId
        }
      },
      update: { quantity },
      create: {
        cartId,
        productId,
        productVariantId: variantId,
        quantity
      }
    });
  },

  async updateQuantity(itemId, quantity) {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
  },

  async removeItem(itemId) {
    return prisma.cartItem.delete({
      where: { id: itemId }
    });
  },

  async findById(itemId) {
    return prisma.cartItem.findUnique({
      where: { id: itemId }
    });
  }
};
