import prisma from '../../../lib/prisma.js';

export const deliveryRepository = {
  async create(data, tx = prisma) {
    return tx.delivery.create({ data });
  },

  async findByOrderId(orderId) {
    return prisma.delivery.findUnique({
      where: { orderId },
      include: {
        events: {
          orderBy: { eventTime: 'desc' }
        }
      }
    });
  },

  async findByTrackingNumber(trackingNumber) {
    return prisma.delivery.findUnique({
      where: { trackingNumber },
      include: { events: true }
    });
  },

  async update(id, data, tx = prisma) {
    return tx.delivery.update({
      where: { id },
      data
    });
  },

  async findActiveDeliveries() {
    return prisma.delivery.findMany({
      where: {
        status: {
          in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'BOOKED', 'PICKED_UP']
        }
      }
    });
  },

  async findSellerDeliveries(shopId, skip = 0, take = 20) {
    return prisma.delivery.findMany({
      where: {
        order: {
          shopId
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        order: { select: { orderNumber: true, status: true } },
        events: { take: 1, orderBy: { eventTime: 'desc' } }
      }
    });
  },

  async findAdminDeliveries(filters = {}, skip = 0, take = 20) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.sellerId) where.order = { shop: { sellerId: filters.sellerId } };
    
    return prisma.delivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        order: { select: { orderNumber: true, shop: { select: { name: true } } } }
      }
    });
  }
};
