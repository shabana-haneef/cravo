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
   * Find all users (excluding password hash)
   */
  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            fullName: true,
            phone: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },


  /**
   * Count the total number of users in the database
   */
  async count() {
    return prisma.user.count();
  }
};
