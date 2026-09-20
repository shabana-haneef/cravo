import { prisma } from '../src/config/prisma.js';
import { redis, pubClient, subClient } from '../src/config/redis.js';
import { queueConnection } from '../src/shared/utils/queue.manager.js';

// Connect Redis at the top-level so it's ready before app.js is imported and evaluated
if (!redis.isOpen) await redis.connect();
if (!pubClient.isOpen) await pubClient.connect();
if (!subClient.isOpen) await subClient.connect();

import { jest } from '@jest/globals';

// Increase default timeout to 30s to prevent flaky timeouts on DB cold starts or slow network
jest.setTimeout(30000);

beforeAll(async () => {
  // Connect dependencies for testing
  await prisma.$connect();
});

