import crypto from "crypto";
import { redis } from "../../../config/redis.js";
import { hashPassword, comparePassword } from "../../../shared/utils/password.js";

const OTP_EXPIRY_SECONDS = 600; // 10 minutes

export const otpService = {
  /**
   * Generates a random 6-digit OTP securely
   * @returns {string} OTP string
   */
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  },

  /**
   * Generates, hashes, and stores the OTP in Redis for the user
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<string>} The plain-text OTP (to be sent via email only)
   */
  async createAndStoreOtp(userId) {
    const plainOtp = this.generateOtp();
    const hashedOtp = await hashPassword(plainOtp);

    const redisKey = `email-verification:${userId}`;
    
    // Store in Redis with EX (expiration) set to 10 minutes
    await redis.set(redisKey, hashedOtp, { EX: OTP_EXPIRY_SECONDS });
    
    return plainOtp;
  },

  /**
   * Validates the provided plain-text OTP against the stored hash in Redis
   * @param {string} userId - The user's ID
   * @param {string} plainOtp - The OTP provided by the user
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async validateOtp(userId, plainOtp) {
    const redisKey = `email-verification:${userId}`;
    const storedHash = await redis.get(redisKey);

    if (!storedHash) {
      return false; // Expired or doesn't exist
    }

    const isValid = await comparePassword(plainOtp, storedHash);
    return isValid;
  },

  /**
   * Deletes the OTP from Redis (used after successful verification)
   * @param {string} userId 
   */
  async deleteOtp(userId) {
    const redisKey = `email-verification:${userId}`;
    await redis.del(redisKey);
  }
};
