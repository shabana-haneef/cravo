import app from "./app.js";

import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import { prisma } from "./config/prisma.js";

import { logger } from "./shared/services/logger.js";
import { initDeliverySyncJob } from "./modules/delivery/jobs/deliverySync.job.js";

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info("PostgreSQL Connected");

    await redis.connect();
    logger.info("Redis Connected");

    initDeliverySyncJob();

    app.listen(env.PORT, () => {
      logger.info(
        `Server running on port ${env.PORT}`
      );
    });
  } catch (error) {
    logger.error(error);

    process.exit(1);
  }
};

startServer();