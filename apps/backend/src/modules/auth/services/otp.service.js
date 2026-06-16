import crypto from "crypto";
import { redis } from "../../../config/redis.js";
import { hashPassword, comparePassword } from "../../../shared/utils/password.js";

/**
 * Reusable OTP utility for any domain-specific OTP flows 
 * (email verification, password reset, 2FA, etc.)
 */
export const otpService = {
  /**
   * Generates a random 6-digit OTP securely
   * @returns {string} OTP string
   */
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  },

  /**
   * Hashes the plain OTP securely for DB/Redis storage
   */
  async hashOtp(plainOtp) {
    return hashPassword(plainOtp);
  },

  /**
   * Stores the hashed OTP in Redis under a specific key
   * @param {string} key - Redis key (e.g., 'password-reset:USER_ID')
   * @param {string} hashedOtp - The encrypted OTP
   * @param {number} ttlSeconds - Time-To-Live in seconds (Default 10 mins)
   */
  async saveOtp(key, hashedOtp, ttlSeconds = 600) {
    await redis.set(key, hashedOtp, { EX: ttlSeconds });
  },

  /**
   * Validates the provided plain-text OTP against the stored hash in Redis
   * @param {string} key - Redis key where the hash is stored
   * @param {string} plainOtp - The OTP provided by the user
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async verifyOtp(key, plainOtp) {
    const storedHash = await redis.get(key);

    if (!storedHash) {
      return false; // Expired or doesn't exist
    }

    return comparePassword(plainOtp, storedHash);
  },

  /**
   * Deletes the OTP from Redis
   * @param {string} key 
   */
  async deleteOtp(key) {
    await redis.del(key);
  }
};
