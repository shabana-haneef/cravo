import prisma from '../../../lib/prisma.js';

export const addressRepository = {
  /**
   * Creates an address. Can run inside a transaction.
   */
  async create(data, tx = prisma) {
    return tx.address.create({ data });
  },

  /**
   * Finds all addresses for a user, defaults listed first.
   */
  async findByUserId(userId) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  },

  /**
   * Finds a specific address, scoping by userId for IDOR protection.
   */
  async findByIdAndUserId(id, userId) {
    return prisma.address.findFirst({
      where: { id, userId }
    });
  },

  /**
   * Updates an address. Can run inside a transaction.
   */
  async update(id, data, tx = prisma) {
    return tx.address.update({
      where: { id },
      data
    });
  },

  /**
   * Safely deletes an address.
   */
  async delete(id) {
    return prisma.address.delete({
      where: { id }
    });
  },

  /**
   * Unsets `isDefault` for all addresses belonging to the user except the specified one.
   * MUST be executed inside a Prisma transaction ($transaction) to avoid race conditions.
   */
  async unsetOtherDefaultAddresses(userId, excludeAddressId, tx) {
    return tx.address.updateMany({
      where: {
        userId,
        id: { not: excludeAddressId },
        isDefault: true
      },
      data: { isDefault: false }
    });
  }
};
