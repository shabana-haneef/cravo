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
        shop: {
          select: {
            name: true,
            slug: true,
            seller: { select: { userId: true } }
          }
        },
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

  async findCustomerOrders(customerId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { customerId };
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          shop: { select: { name: true } },
          items: true
        }
      }),
      prisma.order.count({ where })
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async findSellerOrders(shopId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { shopId };
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: { select: { email: true, profile: { select: { fullName: true } } } },
          items: true
        }
      }),
      prisma.order.count({ where })
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
};
