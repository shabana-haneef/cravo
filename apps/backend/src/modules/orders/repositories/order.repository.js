import prisma from '../../../lib/prisma.js';

export const orderRepository = {
  async create(data, tx = prisma) {
    return tx.order.create({ data });
  },

  async findById(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        shop: { select: { name: true, slug: true } },
        address: true
      }
    });
  },

  async findByOrderNumber(orderNumber) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, payments: true }
    });
  },

  async updateStatus(orderId, status, tx = prisma) {
    return tx.order.update({
      where: { id: orderId },
      data: { status }
    });
  },

  async findCustomerOrders(customerId, skip = 0, take = 20) {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        shop: { select: { name: true } },
        items: true
      }
    });
  },

  async findSellerOrders(shopId, skip = 0, take = 20) {
    return prisma.order.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        customer: { select: { email: true, profile: { select: { fullName: true } } } },
        items: true
      }
    });
  }
};
