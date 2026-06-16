import prisma from '../../../lib/prisma.js';

export const wishlistRepository = {
  async add(userId, productId) {
    return prisma.wishlistItem.create({
      data: {
        userId,
        productId
      },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            variants: { where: { isActive: true }, orderBy: { price: 'asc' }, take: 1 }
          }
        }
      }
    });
  },

  async remove(userId, productId) {
    return prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });
  },

  async checkExists(userId, productId) {
    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });
    return !!item;
  },

  async findAllByUser(userId) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            variants: { where: { isActive: true } },
            category: true,
            shop: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};
