import cron from 'node-cron';
import { jobManager } from '../../../shared/utils/JobManager.js';
import { logger } from '../../../shared/services/logger.js';
import { SitemapService } from '../services/sitemap.service.js';

export const initSitemapJob = () => {
  // Run every day at 2:00 AM
  const job = cron.schedule('0 2 * * *', async () => {
    logger.info('[SitemapJob] Cron triggered, attempting to acquire lock...');

    // Execute with a 15-minute lock to ensure only one instance builds the sitemap
    await jobManager.executeWithLock('sitemap_generation_lock', 15 * 60 * 1000, async () => {
      try {
        logger.info('[SitemapJob] Starting daily sitemap generation...');
        await SitemapService.buildAllAndCache();
        logger.info('[SitemapJob] Sitemap generation completed successfully.');
      } catch (error) {
        logger.error({ err: error }, '[SitemapJob] Sitemap generation failed.');
      }
    });
  });

  jobManager.register(job);
  logger.info('[SitemapJob] Initialized to run daily at 02:00 AM');

  return job;
};
