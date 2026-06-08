import prisma from '../../../lib/prisma.js';

export const productRepository = {
  async create(data, tx = prisma) {
    return tx.product.create({ data });
  },
  async update(id, data, tx = prisma) {
    return tx.product.update({ where: { id }, data });
  },
  async findById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: true
      }
    });
  },
  async findBySlug(slug) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        category: true,
        shop: {
          include: {
            seller: {
              include: { user: { include: { profile: true } } }
            }
          }
        }
      }
    });
  },
  async findByShopId(shopId) {
    return prisma.product.findMany({
      where: { shopId, status: { not: 'ARCHIVED' } },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  async findPendingApplications() {
    return prisma.product.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        shop: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  async slugExists(slug) {
    const count = await prisma.product.count({ where: { slug } });
    return count > 0;
  },
  async searchPublicProducts(filters, sort) {
    const where = { status: 'APPROVED' };

    if (filters.category) {
      where.category = { slug: filters.category };
    }
    if (filters.shop) {
      where.shop = { slug: filters.shop };
    }
    
    if (filters.minPrice || filters.maxPrice) {
      where.variants = {
        some: {
          isActive: true,
          price: {
            gte: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
            lte: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined
          }
        }
      };
    }

    let orderBy = { createdAt: 'desc' };

    return prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 }, 
        variants: { where: { isActive: true }, orderBy: { price: 'asc' }, take: 1 },
        category: true,
        shop: true
      },
      orderBy
    });
  }
};
