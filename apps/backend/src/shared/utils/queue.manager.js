import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../services/logger.js';

// Create a single shared connection config for BullMQ
export const queueConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

queueConnection.on('error', (err) => {
  logger.error({ err }, 'BullMQ Redis Connection Error');
});

// Centralized registry for graceful shutdown
export const activeWorkers = [];

/**
 * Creates a new queue with standard configurations tuned for low Redis command overhead.
 */
export const createQueue = (queueName, options = {}) => {
  return new Queue(queueName, {
    connection: queueConnection,
    defaultJobOptions: {
      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail: { age: 86400, count: 200 },
      ...options.defaultJobOptions,
    },
    ...options,
  });
};

/**
 * Creates a worker and registers it for graceful shutdown.
 * Configured with drainDelay, stalledInterval, and lockDuration to minimize polling traffic on Redis (e.g. Upstash).
 */
export const createWorker = (queueName, processor, options = {}) => {
  const worker = new Worker(queueName, processor, {
    connection: queueConnection,
    drainDelay: 30,         // Wait 30 seconds when queue is empty before checking Redis again (default: 5s)
    stalledInterval: 60000, // Check for stalled jobs every 60 seconds (default: 30s)
    lockDuration: 60000,    // Extend lock duration to 60 seconds to reduce renewal pings
    ...options,
  });
  
  worker.on('error', (err) => logger.error({ err, queueName }, 'Worker error'));
  worker.on('failed', (job, err) => logger.error({ err, queueName, jobId: job?.id }, 'Job failed'));
  
  activeWorkers.push(worker);
  return worker;
};

/**
 * Stops all active workers gracefully.
 */
export const stopAllWorkers = async () => {
  logger.info(`[QueueManager] Stopping ${activeWorkers.length} BullMQ workers gracefully...`);
  await Promise.all(activeWorkers.map(w => w.close()));
  logger.info('[QueueManager] All workers stopped.');
};
