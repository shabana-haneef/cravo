import prisma from '../../../lib/prisma.js';

export const paymentRepository = {
  async create(data, tx = prisma) {
    return tx.payment.create({ data });
  },

  async findByRazorpayOrderId(razorpayOrderId) {
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { order: true }
    });
  },

  async update(paymentId, data, tx = prisma) {
    return tx.payment.update({
      where: { id: paymentId },
      data
    });
  }
};
