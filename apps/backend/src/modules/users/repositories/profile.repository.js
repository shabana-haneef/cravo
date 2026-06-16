import prisma from '../../../lib/prisma.js';

export const profileRepository = {
  async upsertProfile(userId, profileData) {
    return prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });
  },

  async findByUserId(userId) {
    return prisma.profile.findUnique({
      where: { userId }
    });
  }
};
