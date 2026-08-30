import prisma from '../../../lib/prisma.js';

export const productRepository = {
  async create(data, tx = prisma) {
    return tx.product.create({ data });
  },
  async update(id, data, tx = prisma) {
    return tx.product.update({ where: { id }, data });
  },
  async countByCategory(categoryId) {
    return prisma.product.count({ where: { categoryId } });
  },
  async findById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 10 },
        variants: { include: { inventory: true }, take: 50 },
        category: true,
        shop: { select: { id: true, name: true, slug: true, seller: { select: { id: true, userId: true, user: { select: { email: true } } } } } }
      }
    });
  },
  async findByIdWithDetails(id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 10 },
        variants: { where: { isActive: true }, include: { inventory: true }, take: 50 },
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            seller: {
              select: { id: true, userId: true, user: { select: { id: true, email: true, profile: { select: { fullName: true } } } } }
            }
          }
        }
      }
    });
  },
  async findBySlug(slug) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 10 },
        variants: { where: { isActive: true }, include: { inventory: true }, take: 50 },
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            seller: {
              select: { id: true, userId: true, user: { select: { id: true, email: true, profile: { select: { fullName: true } } } } }
            }
          }
        }
      }
    });
  },
  async findByShopId(shopId, page = 1, requestedLimit = 10, cursor = null) {
    const limit = Math.min(Number(requestedLimit) || 10, 100);
    const where = { shopId, status: { not: 'ARCHIVED' } };

    const paginationArgs = cursor
      ? { cursor: { id: cursor }, skip: 1, take: limit }
      : { skip: (page - 1) * limit, take: limit };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        ...paginationArgs,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 10 },
          variants: { include: { inventory: true }, take: 50 },
          category: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    const nextCursor = data.length === limit ? data[data.length - 1].id : null;
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), nextCursor } };
  },
  async findPendingApplications(status = 'PENDING_APPROVAL') {
    return prisma.product.findMany({
      where: { status },
      take: 100, // Hard limit to prevent unbounded array DoS
      include: {
        shop: { 
          select: { 
            id: true,
            name: true, 
            slug: true, 
            seller: { 
              select: { id: true, userId: true, user: { select: { id: true, email: true, profile: { select: { fullName: true } } } } } 
            } 
          } 
        },
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 3 },
        variants: { where: { isActive: true }, take: 50 }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  async slugExists(slug) {
    const count = await prisma.product.count({ where: { slug } });
    return count > 0;
  },
  async searchPublicProducts(filters, sort, page = 1, requestedLimit = 10, cursor = null) {
    const limit = Math.min(Number(requestedLimit) || 10, 100);
    const where = { 
      status: 'APPROVED',
      shop: {
        status: 'ACTIVE'
      }
    };

    if (filters.category) {
      where.category = { slug: filters.category };
    }
    if (filters.shop) {
      where.shop = { slug: filters.shop };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
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

    let orderBy = { id: 'desc' }; // Cursor requires deterministic ID sort

    const paginationArgs = cursor
      ? { cursor: { id: cursor }, skip: 1, take: limit }
      : { skip: (page - 1) * limit, take: limit };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        ...paginationArgs,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 }, 
          variants: { where: { isActive: true }, orderBy: { price: 'asc' }, take: 1, include: { inventory: true } },
          category: true,
          shop: true
        },
        orderBy
      }),
      prisma.product.count({ where })
    ]);

    const nextCursor = data.length === limit ? data[data.length - 1].id : null;
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), nextCursor } };
  },
  async getSuggestions(q) {
    return prisma.product.findMany({
      where: {
        status: 'APPROVED',
        shop: {
          status: 'ACTIVE'
        },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } }
        ]
      },
      take: 8,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { isActive: true }, take: 1 }
      }
    });
  }
};
