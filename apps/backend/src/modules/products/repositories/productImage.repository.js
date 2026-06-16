import prisma from '../../../lib/prisma.js';

export const productImageRepository = {
  async createMany(data, tx = prisma) {
    return tx.productImage.createMany({ data });
  },
  async deleteByProductId(productId, tx = prisma) {
    return tx.productImage.deleteMany({ where: { productId } });
  }
};
