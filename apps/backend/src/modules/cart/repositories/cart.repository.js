import prisma from '../../../lib/prisma.js';

export const cartRepository = {
  async getByUserId(userId) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true
          }
        },
        shop: true
      }
    });
  },

  async upsert(userId, shopId = null) {
    return prisma.cart.upsert({
      where: { userId },
      update: shopId ? { shopId } : {},
      create: {
        userId,
        shopId
      }
    });
  },

  async clearShopId(cartId) {
    return prisma.cart.update({
      where: { id: cartId },
      data: { shopId: null }
    });
  },

  async clearCart(userId) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return null;

    return prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return tx.cart.update({
        where: { id: cart.id },
        data: { shopId: null }
      });
    });
  }
};
