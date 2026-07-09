import { redis } from '../../config/redis.js';
import { logger } from '../services/logger.js';

class JobManager {
  constructor() {
    this.jobs = [];
    this.activeExecutions = new Set();
  }

  /**
   * Register a scheduled cron job so it can be stopped gracefully.
   * @param {Object} job - The node-cron job instance
   */
  register(job) {
    this.jobs.push(job);
  }

  /**
   * Executes a job exclusively across all instances using a Redis lock.
   * Ensures that a single job execution runs at a time globally.
   * 
   * @param {string} jobName - Unique name for the job (used for lock key)
   * @param {number} lockDurationMs - Maximum duration to hold the lock before auto-expiry (e.g., 290000 for 5 mins)
   * @param {Function} callback - The async function to execute
   */
  async executeWithLock(jobName, lockDurationMs, callback) {
    const lockKey = `job_lock:${jobName}`;
    const lockValue = Date.now().toString();

    let lockAcquired = false;

    try {
      // Try to acquire distributed lock
      // NX: Only set the key if it does not already exist.
      // PX: Set the specified expire time, in milliseconds.
      const result = await redis.set(lockKey, lockValue, {
        NX: true,
        PX: lockDurationMs
      });

      if (!result) {
        // Lock is already held by another instance (or previous execution)
        logger.debug(`[JobManager] Job '${jobName}' skipped (lock held by another instance).`);
        return;
      }

      lockAcquired = true;
      logger.info(`[JobManager] Acquired lock for job '${jobName}'. Starting execution.`);

      // Wrap callback execution for tracking
      const executionPromise = (async () => {
        try {
          await callback();
        } catch (error) {
          logger.error({ err: error, jobName }, `[JobManager] Job '${jobName}' encountered an error.`);
        }
      })();

      this.activeExecutions.add(executionPromise);
      
      // Wait for execution to complete
      await executionPromise;
      
      this.activeExecutions.delete(executionPromise);
    } catch (error) {
      logger.error({ err: error, jobName }, `[JobManager] Failed to acquire lock or execute job '${jobName}'.`);
    } finally {
      // Always release lock if we acquired it
      if (lockAcquired) {
        try {
          await redis.del(lockKey);
          logger.debug(`[JobManager] Released lock for job '${jobName}'.`);
        } catch (delError) {
          logger.error({ err: delError, jobName }, `[JobManager] Failed to release lock for job '${jobName}'.`);
        }
      }
    }
  }

  /**
   * Stops all cron schedules and waits for active job executions to finish.
   * Limits the waiting time to prevent hanging indefinitely.
   * 
   * @param {number} timeoutMs - Max time to wait for active jobs
   * @returns {Promise<void>}
   */
  async stopAndAwait(timeoutMs = 8000) {
    logger.info(`[JobManager] Stopping ${this.jobs.length} scheduled jobs...`);
    
    // Stop all schedules from triggering new ticks
    for (const job of this.jobs) {
      if (job && typeof job.stop === 'function') {
        job.stop();
      }
    }

    if (this.activeExecutions.size === 0) {
      logger.info('[JobManager] No active job executions. Ready for shutdown.');
      return;
    }

    logger.info(`[JobManager] Waiting for ${this.activeExecutions.size} active job(s) to finish (up to ${timeoutMs}ms)...`);

    // Race between active jobs finishing and timeout
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    const executionsPromise = Promise.allSettled(Array.from(this.activeExecutions));

    await Promise.race([executionsPromise, timeoutPromise]);

    if (this.activeExecutions.size > 0) {
      logger.warn(`[JobManager] Shutdown timeout reached with ${this.activeExecutions.size} job(s) still active.`);
    } else {
      logger.info('[JobManager] All active jobs finished gracefully.');
    }
  }
}

export const jobManager = new JobManager();
