import prisma from '../../../lib/prisma.js';

export const productVariantRepository = {
  async create(data, tx = prisma) {
    return tx.productVariant.create({ data });
  },
  async createMany(data, tx = prisma) {
    return tx.productVariant.createMany({ data });
  },
  async findById(id) {
    return prisma.productVariant.findUnique({ where: { id } });
  },
  async update(id, data, tx = prisma) {
    return tx.productVariant.update({ where: { id }, data });
  },
  async delete(id, tx = prisma) {
    return tx.productVariant.delete({ where: { id } });
  },
  async skuExists(sku, tx = prisma) {
    const count = await tx.productVariant.count({ where: { sku } });
    return count > 0;
  }
};
