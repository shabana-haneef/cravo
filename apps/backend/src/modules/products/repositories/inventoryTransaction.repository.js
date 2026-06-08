import prisma from '../../../lib/prisma.js';

export const inventoryTransactionRepository = {
  async create(data, tx = prisma) {
    return tx.inventoryTransaction.create({ data });
  },

  async findHistoryByVariantId(variantId, skip = 0, take = 20) {
    const inventory = await prisma.inventory.findUnique({
      where: { productVariantId: variantId }
    });

    if (!inventory) return { transactions: [], total: 0 };

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where: { inventoryId: inventory.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.inventoryTransaction.count({
        where: { inventoryId: inventory.id }
      })
    ]);

    return { transactions, total };
  }
};
