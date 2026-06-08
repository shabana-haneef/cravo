import prisma from '../../../lib/prisma.js';

export const sellerRepository = {
  async create(data, tx = prisma) {
    return tx.seller.create({ data });
  },

  async findByUserId(userId) {
    return prisma.seller.findUnique({
      where: { userId },
      include: {
        documents: true
      }
    });
  },

  async findById(id) {
    return prisma.seller.findUnique({
      where: { id },
      include: {
        documents: true,
        user: {
          select: {
            email: true,
            id: true
          }
        }
      }
    });
  },

  async updateStatus(id, status, updates = {}, tx = prisma) {
    return tx.seller.update({
      where: { id },
      data: {
        status,
        ...updates
      }
    });
  },

  async listApplications(status) {
    const where = status ? { status } : {};
    return prisma.seller.findMany({
      where,
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};
