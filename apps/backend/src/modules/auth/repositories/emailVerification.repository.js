import prisma from '../../../lib/prisma.js';

/**
 * Email Verification Repository
 * Manages OTP storage for email verifications securely.
 */
export const emailVerificationRepository = {
  /**
   * Create a new email verification record
   * @param {Object} data - Contains userId, otpHash, expiresAt
   */
  async create(data) {
    return prisma.emailVerification.create({
      data,
    });
  },

  /**
   * Find the most recent active OTP attempt for a user
   */
  async findValidAttempt(userId) {
    return prisma.emailVerification.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Ensure not expired
      },
      orderBy: { createdAt: 'desc' }, // Get the latest one
    });
  },

  /**
   * Increment failed attempts to prevent brute force
   */
  async incrementAttempts(id) {
    return prisma.emailVerification.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },

  /**
   * Cleanup all verification tokens for a user after success
   */
  async deleteByUser(userId) {
    return prisma.emailVerification.deleteMany({
      where: { userId },
    });
  },

  /**
   * Background job method to purge old tokens and free up space
   */
  async deleteExpiredTokens() {
    return prisma.emailVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
};
