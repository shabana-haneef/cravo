import { prisma } from '../src/config/prisma.js';
import { redis, pubClient, subClient } from '../src/config/redis.js';
import { queueConnection } from '../src/shared/utils/queue.manager.js';

beforeAll(async () => {
  // Connect dependencies for testing
  await prisma.$connect();
  if (!redis.isOpen) await redis.connect();
  if (!pubClient.isOpen) await pubClient.connect();
  if (!subClient.isOpen) await subClient.connect();
});
