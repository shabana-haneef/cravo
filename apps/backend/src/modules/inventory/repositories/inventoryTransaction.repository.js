import prisma from '../../../lib/prisma.js';

export const inventoryTransactionRepository = {
  async create(data, tx = prisma) {
    return tx.inventoryTransaction.create({ data });
  },

  async findHistoryByVariantId(variantId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const inventory = await prisma.inventory.findUnique({
      where: { productVariantId: variantId }
    });

    if (!inventory) return { transactions: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where: { inventoryId: inventory.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.inventoryTransaction.count({
        where: { inventoryId: inventory.id }
      })
    ]);

    return { transactions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
};
