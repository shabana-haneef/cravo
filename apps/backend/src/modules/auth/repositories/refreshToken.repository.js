import prisma from '../../../lib/prisma.js';

/**
 * Refresh Token Repository
 * Core foundation for session management and token rotation.
 */
export const refreshTokenRepository = {
  /**
   * Store a new refresh token hash
   */
  async create(data, tx = prisma) {
    return tx.refreshToken.create({
      data,
    });
  },

  /**
   * Find a specific token by its hash
   * Optimized with a Prisma @@index on tokenHash
   */
  async findByTokenHash(tokenHash, tx = prisma) {
    return tx.refreshToken.findUnique({
      where: { tokenHash },
    });
  },

  /**
   * Update a specific token (e.g. soft-revoke during rotation)
   */
  async update(tokenHash, data, tx = prisma) {
    return tx.refreshToken.update({
      where: { tokenHash },
      data,
    });
  },

  /**
   * Delete a specific token (e.g. during rotation or targeted logout)
   */
  async deleteByTokenHash(tokenHash, tx = prisma) {
    return tx.refreshToken.delete({
      where: { tokenHash },
    });
  },

  /**
   * Delete all refresh tokens for a user (Global logout)
   */
  async deleteByUser(userId, tx = prisma) {
    return tx.refreshToken.deleteMany({
      where: { userId },
    });
  },

  /**
   * Purge expired tokens
   */
  async deleteExpiredTokens(tx = prisma) {
    return tx.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
};
