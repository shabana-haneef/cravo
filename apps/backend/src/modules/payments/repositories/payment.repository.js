import prisma from '../../../lib/prisma.js';

export const paymentRepository = {
  async create(data, tx = prisma) {
    return tx.payment.create({ data });
  },

  async findByRazorpayOrderId(razorpayOrderId) {
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: {
        order: {
          include: {
            shop: {
              select: {
                seller: { select: { userId: true } }
              }
            }
          }
        }
      }
    });
  },

  async findByRazorpayPaymentId(razorpayPaymentId) {
    return prisma.payment.findUnique({
      where: { razorpayPaymentId }
    });
  },

  async update(id, data, tx = prisma) {
    return tx.payment.update({
      where: { id },
      data
    });
  }
};
