import { createServer } from 'http';
import app from './app.js';

import { env } from './config/env.js';
import { redis, pubClient, subClient } from './config/redis.js';
import { prisma } from './config/prisma.js';

import { logger } from './shared/services/logger.js';
import { initDeliverySyncJob } from './modules/delivery/jobs/deliverySync.job.js';
import { initOrderMaintenanceJob } from './modules/orders/jobs/orderMaintenance.job.js';
import { initSitemapJob } from './modules/seo/jobs/sitemap.job.js';
import { jobManager } from './shared/utils/JobManager.js';
import { initSocket } from './lib/socket.js';

let httpServer;
let io;
let deliverySyncJob;
let orderMaintenanceJob;
let sitemapJob;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL Connected');

    await redis.connect();
    await pubClient.connect();
    await subClient.connect();
    logger.info('Redis (Main, Pub, Sub) Connected');

    deliverySyncJob = initDeliverySyncJob();
    orderMaintenanceJob = initOrderMaintenanceJob();
    sitemapJob = initSitemapJob();

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
    // 1. Stop background jobs and wait for active executions to finish
    await jobManager.stopAndAwait(8000);

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