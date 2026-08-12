import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { campaignExpiryQueue } from '../../modules/campaigns/jobs/campaignExpiry.job.js';
import { deliverySyncQueue } from '../../modules/delivery/jobs/deliverySync.job.js';
import { orderMaintenanceQueue } from '../../modules/orders/jobs/orderMaintenance.job.js';
import { sitemapQueue } from '../../modules/seo/jobs/sitemap.job.js';
import { notificationQueue } from '../jobs/notification.job.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(campaignExpiryQueue),
    new BullMQAdapter(deliverySyncQueue),
    new BullMQAdapter(orderMaintenanceQueue),
    new BullMQAdapter(sitemapQueue),
    new BullMQAdapter(notificationQueue)
  ],
  serverAdapter: serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();
