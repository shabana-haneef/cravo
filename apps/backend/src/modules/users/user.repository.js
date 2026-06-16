import { prisma } from "../../config/prisma.js";

export const userRepository = {
  findByEmail(email) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  },

  create(data) {
    return prisma.user.create({
      data,
    });
  },
};