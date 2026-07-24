import { logger } from '../../../shared/services/logger.js';
import { SitemapService } from '../services/sitemap.service.js';
import { createQueue, createWorker } from '../../../shared/utils/queue.manager.js';

export const sitemapQueue = createQueue('sitemap');

export const initSitemapWorker = () => {
  createWorker('sitemap', async (job) => {
    try {
      logger.info('[SitemapWorker] Starting daily sitemap generation...');
      await SitemapService.buildAllAndCache();
      logger.info('[SitemapWorker] Sitemap generation completed successfully.');
      return { success: true };
    } catch (error) {
      logger.error({ err: error }, '[SitemapWorker] Sitemap generation failed.');
      throw error;
    }
  });

  // Add the repeatable job (runs every day at 2:00 AM)
  sitemapQueue.add('generate-sitemap', {}, {
    repeat: { pattern: '0 2 * * *' },
    jobId: 'repeat-sitemap'
  }).catch(err => logger.error({ err }, 'Failed to schedule sitemap job'));

  logger.info('[SitemapWorker] Worker initialized and repeatable job scheduled.');
};
