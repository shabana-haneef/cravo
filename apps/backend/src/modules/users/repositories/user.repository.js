import prisma from '../../../lib/prisma.js';

/**
 * User Repository
 * Handles all database operations for the User entity.
 * Keeps controllers and services decoupled from Prisma ORM.
 */
export const userRepository = {
  /**
   * Find a user by their unique ID
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Find a user by their email
   * Optimized with a Prisma @@index on email
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Create a new user
   */
  async create(data) {
    return prisma.user.create({
      data,
    });
  },

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Count the total number of users in the database
   */
  async count() {
    return prisma.user.count();
  }
};
