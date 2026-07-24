import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';
import { createQueue, createWorker } from '../../../shared/utils/queue.manager.js';

export const campaignExpiryQueue = createQueue('campaignExpiry');

export const initCampaignExpiryWorker = () => {
  createWorker('campaignExpiry', async (job) => {
    logger.info('[CampaignExpiryWorker] Checking for expired campaigns...');
    
    const now = new Date();
    
    // Find active campaigns that have passed their end date
    const expiredCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now }
      },
      select: { id: true, sellerId: true }
    });

    if (expiredCampaigns.length === 0) {
      logger.info('[CampaignExpiryWorker] No campaigns to expire.');
      return { expired: 0 };
    }

    logger.info(`[CampaignExpiryWorker] Found ${expiredCampaigns.length} campaigns to expire. Processing...`);

    const campaignIds = expiredCampaigns.map(c => c.id);

    await prisma.$transaction(async (tx) => {
      // 1. Bulk update status
      await tx.campaign.updateMany({
        where: { id: { in: campaignIds } },
        data: { status: 'EXPIRED' }
      });

      // 2. Bulk insert status history
      const historyRecords = campaignIds.map(id => ({
        campaignId: id,
        status: 'EXPIRED',
        reason: 'Campaign automatically expired (endDate reached)',
        changedBy: 'SYSTEM'
      }));
      await tx.campaignStatusHistory.createMany({ data: historyRecords });
    });

    logger.info(`[CampaignExpiryWorker] Successfully expired ${campaignIds.length} campaigns.`);
    
    return { expired: campaignIds.length };
  });

  // Add the repeatable job (runs every hour at minute 0)
  campaignExpiryQueue.add('check-expired-campaigns', {}, {
    repeat: { pattern: '0 * * * *' },
    jobId: 'repeat-campaign-expiry'
  }).catch(err => logger.error({ err }, 'Failed to schedule campaign expiry job'));

  logger.info('[CampaignExpiryWorker] Worker initialized and repeatable job scheduled.');
};
