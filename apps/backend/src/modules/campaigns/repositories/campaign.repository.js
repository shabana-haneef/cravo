import prisma from '../../../lib/prisma.js';

export const campaignRepository = {
  async create(data, tx = prisma) {
    return tx.campaign.create({ data });
  },

  async update(id, data, tx = prisma) {
    return tx.campaign.update({ where: { id }, data });
  },

  async findById(id) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        seller: { include: { user: true } },
        shop: true,
        payment: true,
        analytics: true,
        history: { orderBy: { createdAt: 'desc' } }
      }
    });
  },

  async findBySellerId(sellerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { sellerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: true,
          analytics: true
        }
      }),
      prisma.campaign.count({ where: { sellerId } })
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async findPendingCampaigns(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { status: 'PENDING_APPROVAL' },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          seller: { include: { user: { include: { profile: true } } } },
          shop: true
        }
      }),
      prisma.campaign.count({ where: { status: 'PENDING_APPROVAL' } })
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async updateAnalytics(campaignId, impressions = 0, clicks = 0) {
    return prisma.campaignAnalytics.upsert({
      where: { campaignId },
      update: {
        impressions: { increment: impressions },
        clicks: { increment: clicks }
      },
      create: {
        campaignId,
        impressions,
        clicks
      }
    });
  },

  async addStatusHistory(campaignId, status, changedBy, reason = null, tx = prisma) {
    return tx.campaignStatusHistory.create({
      data: {
        campaignId,
        status,
        changedBy,
        reason
      }
    });
  },

  async createPayment(data, tx = prisma) {
    return tx.campaignPayment.create({ data });
  },
  
  async updatePayment(campaignId, data, tx = prisma) {
    return tx.campaignPayment.update({
      where: { campaignId },
      data
    });
  }
};
