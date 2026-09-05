import { createServer } from 'http';

import { env } from './config/env.js';
import { redis, pubClient, subClient } from './config/redis.js';
import { prisma } from './config/prisma.js';

import { logger } from './shared/services/logger.js';
import { initDeliverySyncWorker } from './modules/delivery/jobs/deliverySync.job.js';
import { initOrderMaintenanceWorker } from './modules/orders/jobs/orderMaintenance.job.js';
import { initSitemapWorker } from './modules/seo/jobs/sitemap.job.js';
import { initCampaignExpiryWorker } from './modules/campaigns/jobs/campaignExpiry.job.js';
import { stopAllWorkers, queueConnection } from './shared/utils/queue.manager.js';
import { initSocket } from './lib/socket.js';
import { startReconciliationJob } from './modules/delivery/jobs/reconciliation.job.js';

let httpServer;
let io;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL Connected');

    await redis.connect();
    await pubClient.connect();
    await subClient.connect();
    logger.info('Redis (Main, Pub, Sub) Connected');

    initDeliverySyncWorker();
    initOrderMaintenanceWorker();
    initSitemapWorker();
    initCampaignExpiryWorker();
    startReconciliationJob();

    const { default: app } = await import('./app.js');
    httpServer = createServer(app);
    io = initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      
      // PM2 Zero Downtime Deployment Signal
      if (process.send) {
        process.send('ready');
        logger.info('PM2 ready signal sent');
      }
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Hard timeout to force exit if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();

  try {
    // 1. Stop BullMQ workers gracefully
    await stopAllWorkers();

    // 2. Stop accepting new HTTP requests
    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close((err) => {
          if (err) logger.error(err, 'Error closing HTTP server');
          else logger.info('HTTP server closed.');
          resolve();
        });
      });
    }

    // 3. Close Socket.io connections
    if (io) {
      io.close(() => {
        logger.info('Socket.io connections closed.');
      });
    }

    // 4. Disconnect Prisma
    await prisma.$disconnect();
    logger.info('PostgreSQL disconnected.');

    // 5. Disconnect Redis
    if (redis.isOpen) await redis.quit();
    if (pubClient.isOpen) await pubClient.quit();
    if (subClient.isOpen) await subClient.quit();
    queueConnection.disconnect();
    logger.info('Redis disconnected.');

    logger.info('Graceful shutdown completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught Exception');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ err: reason, promise }, 'Unhandled Rejection');
  gracefulShutdown('unhandledRejection');
});

startServer();