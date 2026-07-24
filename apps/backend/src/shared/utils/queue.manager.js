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
 * Creates a new queue with standard configurations.
 */
export const createQueue = (queueName) => {
  return new Queue(queueName, { connection: queueConnection });
};

/**
 * Creates a worker and registers it for graceful shutdown.
 */
export const createWorker = (queueName, processor, options = {}) => {
  const worker = new Worker(queueName, processor, {
    connection: queueConnection,
    ...options
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
