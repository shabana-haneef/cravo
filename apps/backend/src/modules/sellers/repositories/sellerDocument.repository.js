import prisma from '../../../lib/prisma.js';

export const sellerDocumentRepository = {
  async createMany(documents, tx = prisma) {
    return tx.sellerDocument.createMany({
      data: documents
    });
  }
};
