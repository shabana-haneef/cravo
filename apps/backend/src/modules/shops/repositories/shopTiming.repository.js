import prisma from '../../../lib/prisma.js';

export const shopTimingRepository = {
  async upsertMany(shopId, timings, tx = prisma) {
    // Replace all existing timings to avoid stale days
    await tx.shopTiming.deleteMany({
      where: { shopId }
    });

    const data = timings.map(t => ({
      ...t,
      shopId
    }));

    return tx.shopTiming.createMany({ data });
  }
};
