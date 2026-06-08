import prisma from '../../../lib/prisma.js';

export const shopRepository = {
  async create(data, tx = prisma) {
    return tx.shop.create({ data });
  },

  async update(id, data, tx = prisma) {
    return tx.shop.update({
      where: { id },
      data
    });
  },

  async findBySellerId(sellerId) {
    return prisma.shop.findUnique({
      where: { sellerId },
      include: { timings: true }
    });
  },

  async findBySlug(slug) {
    return prisma.shop.findUnique({
      where: { slug },
      include: {
        timings: true,
        seller: {
          select: {
            bio: true,
            averageRating: true,
            totalReviews: true,
            user: {
              select: {
                profile: {
                  select: { fullName: true, phone: true }
                }
              }
            }
          }
        }
      }
    });
  },

  async slugExists(slug) {
    const count = await prisma.shop.count({ where: { slug } });
    return count > 0;
  }
};
