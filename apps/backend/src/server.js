import { createServer } from 'http';
import app from './app.js';

import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { prisma } from './config/prisma.js';

import { logger } from './shared/services/logger.js';
import { initDeliverySyncJob } from './modules/delivery/jobs/deliverySync.job.js';
import { initOrderMaintenanceJob } from './modules/orders/jobs/orderMaintenance.job.js';
import { initSocket } from './lib/socket.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL Connected');

    await redis.connect();
    logger.info('Redis Connected');

    initDeliverySyncJob();
    initOrderMaintenanceJob();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

startServer();