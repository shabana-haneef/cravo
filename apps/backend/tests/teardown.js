import { prisma } from '../src/config/prisma.js';
import { redis, pubClient, subClient } from '../src/config/redis.js';
import { stopAllWorkers, queueConnection } from '../src/shared/utils/queue.manager.js';

export default async () => {
  // Gracefully stop all workers
  await stopAllWorkers();
  
  // Disconnect Database
  await prisma.$disconnect();

  // Disconnect Redis
  if (redis.isOpen) await redis.quit();
  if (pubClient.isOpen) await pubClient.quit();
  if (subClient.isOpen) await subClient.quit();
  queueConnection.disconnect();
  
  // Force exit to ensure jest stops hanging process
  setTimeout(() => process.exit(0), 500);
};
