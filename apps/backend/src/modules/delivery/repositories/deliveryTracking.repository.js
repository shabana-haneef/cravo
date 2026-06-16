import prisma from '../../../lib/prisma.js';

export const deliveryTrackingRepository = {
  async createEvent(data, tx = prisma) {
    // Prevent duplicate events for the same status within a short timeframe
    const existing = await tx.deliveryTrackingEvent.findFirst({
      where: {
        deliveryId: data.deliveryId,
        status: data.status
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existing && (new Date() - new Date(existing.createdAt)) < 1000 * 60 * 60) {
      // Ignore if same status recorded within last hour
      return existing;
    }

    return tx.deliveryTrackingEvent.create({ data });
  }
};
