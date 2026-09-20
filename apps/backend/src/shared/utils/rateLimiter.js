import { redis } from '../../config/redis.js';
import { AppError } from '../errors/AppError.js';

/**
 * Checks a Redis sliding window rate limit.
 * @param {string} key - Redis key for the bucket
 * @param {number} limit - Max allowed requests in the window
 * @param {number} windowSeconds - Size of the window in seconds
 * @param {string} errorMessage - Error message if limit exceeded
 * @param {string} errorCode - Error code if limit exceeded
 */
export async function checkSlidingRateLimit(key, limit, windowSeconds, errorMessage, errorCode) {
  if (redis && redis.isOpen) {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    
    await redis.zRemRangeByScore(key, 0, windowStart).catch(() => {});
    const count = await redis.zCard(key).catch(() => 0);
    
    if (count >= limit) {
      throw new AppError(errorMessage, 429, errorCode);
    }
    
    await redis.zAdd(key, { score: now, value: `${now}-${Math.random()}` }).catch(() => {});
    await redis.expire(key, windowSeconds).catch(() => {});
  }
}
