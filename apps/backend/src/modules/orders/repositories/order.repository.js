import prisma from '../../../lib/prisma.js';

export const orderRepository = {
  async create(data, tx = prisma) {
    return tx.order.create({ data });
  },

  async findById(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' }, take: 1 }
              }
            },
            productVariant: true
          }
        },
        payments: { include: { refunds: true } },
        shop: {
          select: {
            name: true,
            slug: true,
            seller: {
              select: {
                userId: true,
                pickupLocationName: true,
                pickupAddress: true,
                pickupCity: true,
                pickupState: true,
                pickupPincode: true,
                pickupPhone: true
              }
            }
          }
        },
        address: true
      }
    });
  },

  async findByOrderNumber(orderNumber) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, payments: { include: { refunds: true } } }
    });
  },

  async updateStatus(orderId, status, tx = prisma) {
    return tx.order.update({
      where: { id: orderId },
      data: { status }
    });
  },

  async findCustomerOrders(customerId, page = 1, requestedLimit = 20) {
    const limit = Math.min(Number(requestedLimit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { 
      customerId,
      status: { not: 'PENDING_PAYMENT' }
    };
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          shop: { select: { name: true, slug: true } },
          address: true,
          payments: { include: { refunds: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { orderBy: { sortOrder: 'asc' }, take: 1 }
                }
              },
              productVariant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  weight: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async findSellerOrders(shopId, page = 1, requestedLimit = 20) {
    const limit = Math.min(Number(requestedLimit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { 
      shopId,
      status: { not: 'PENDING_PAYMENT' }
    };
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          shop: {
            select: {
              name: true,
              slug: true,
              seller: {
                select: {
                  pickupLocationName: true,
                  pickupAddress: true,
                  pickupCity: true,
                  pickupState: true,
                  pickupPincode: true,
                  pickupPhone: true
                }
              }
            }
          },
          customer: { select: { email: true, profile: { select: { fullName: true } } } },
          address: true,
          payments: { include: { refunds: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { orderBy: { sortOrder: 'asc' }, take: 1 }
                }
              },
              productVariant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  weight: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
};
