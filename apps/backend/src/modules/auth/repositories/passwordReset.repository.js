import prisma from '../../../lib/prisma.js';

/**
 * Password Reset Repository
 * Securely manages password reset tokens to prevent unauthorized account recovery.
 */
export const passwordResetRepository = {
  /**
   * Create a new password reset attempt
   * @param {Object} data - Contains userId, otpHash, expiresAt
   */
  async create(data) {
    return prisma.passwordReset.create({
      data,
    });
  },

  /**
   * Find the most recent active reset attempt for a user
   */
  async findValidAttempt(userId) {
    return prisma.passwordReset.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Increment failed attempts to prevent brute force
   */
  async incrementAttempts(id) {
    return prisma.passwordReset.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },

  /**
   * Delete all reset tokens for a user after successful password change
   */
  async deleteByUser(userId) {
    return prisma.passwordReset.deleteMany({
      where: { userId },
    });
  },

  /**
   * Purge expired tokens
   */
  async deleteExpiredTokens() {
    return prisma.passwordReset.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
};
