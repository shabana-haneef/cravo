import prisma from '../../../lib/prisma.js';

export const notificationRepository = {
  async create(data) {
    return prisma.notification.create({ data });
  },

  async findByUserId(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async countUnread(userId) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markAsRead(id, userId) {
    // IDOR protection: only owner can mark as read
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
  },

  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
};
