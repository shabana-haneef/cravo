import prisma from '../../../lib/prisma.js';

/**
 * Refresh Token Repository
 * Core foundation for session management and token rotation.
 */
export const refreshTokenRepository = {
  /**
   * Store a new refresh token hash
   */
  async create(data) {
    return prisma.refreshToken.create({
      data,
    });
  },

  /**
   * Find a specific token by its hash
   * Optimized with a Prisma @@index on tokenHash
   */
  async findByTokenHash(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  },

  /**
   * Delete a specific token (e.g. during rotation or targeted logout)
   */
  async deleteByTokenHash(tokenHash) {
    return prisma.refreshToken.delete({
      where: { tokenHash },
    });
  },

  /**
   * Delete all refresh tokens for a user (Global logout)
   */
  async deleteByUser(userId) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },

  /**
   * Purge expired tokens
   */
  async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
};
