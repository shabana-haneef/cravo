import prisma from '../../../lib/prisma.js';

export const inventoryRepository = {
  async findByVariantId(variantId, tx = prisma) {
    return tx.inventory.findUnique({
      where: { productVariantId: variantId }
    });
  },

  async findByVariantIdWithProduct(variantId, tx = prisma) {
    return tx.inventory.findUnique({
      where: { productVariantId: variantId },
      include: {
        productVariant: {
          include: {
            product: true
          }
        }
      }
    });
  },

  async update(id, data, tx = prisma) {
    return tx.inventory.update({
      where: { id },
      data
    });
  }
};
