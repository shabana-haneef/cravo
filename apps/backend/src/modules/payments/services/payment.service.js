import { paymentRepository } from '../repositories/payment.repository.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { razorpayService } from './razorpay.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';

export const paymentService = {
  async verifyPayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    // 1. Verify Signature
    const isValid = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new AppError("Invalid payment signature", 400);
    }

    // 2. Fetch Payment Record
    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!payment) throw new AppError("Payment record not found", 404);

    if (payment.status === 'SUCCESS') {
      return { message: "Payment already verified" };
    }

    if (payment.order.customerId !== userId) {
      throw new AppError("Unauthorized access to this payment", 403);
    }

    // 3. Update Statuses Atomically
    return prisma.$transaction(async (tx) => {
      await paymentRepository.update(payment.id, {
        razorpayPaymentId,
        razorpaySignature,
        status: 'SUCCESS'
      }, tx);

      await orderRepository.updateStatus(payment.orderId, 'PLACED', tx);
      
      logger.info({ userId, orderId: payment.orderId, razorpayPaymentId }, 'Payment successful and order placed');

      return { success: true, orderId: payment.orderId };
    });
  },

  async handleWebhook(body, signature) {
    const rawBody = JSON.stringify(body);
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) throw new AppError("Invalid webhook signature", 400);

    const event = body.event;
    const payload = body.payload.payment.entity;

    const payment = await paymentRepository.findByRazorpayOrderId(payload.order_id);
    if (!payment) return; // Ignore unmapped payments

    if (event === 'payment.captured' && payment.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        await paymentRepository.update(payment.id, {
          razorpayPaymentId: payload.id,
          status: 'SUCCESS'
        }, tx);
        await orderRepository.updateStatus(payment.orderId, 'PLACED', tx);
      });
      logger.info({ orderId: payment.orderId }, 'Webhook: Payment captured');
    }

    if (event === 'payment.failed' && payment.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        await paymentRepository.update(payment.id, {
          razorpayPaymentId: payload.id,
          status: 'FAILED'
        }, tx);
        await orderRepository.updateStatus(payment.orderId, 'CANCELLED', tx);
        
        // Release reserved stock back to available
        const order = await orderRepository.findById(payment.orderId);
        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { productVariantId: item.productVariantId }
          });
          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                availableStock: inventory.availableStock + item.quantity,
                reservedStock: inventory.reservedStock - item.quantity
              }
            });
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inventory.id,
                type: 'ORDER_RELEASED',
                quantity: item.quantity,
                previousStock: inventory.availableStock,
                newStock: inventory.availableStock + item.quantity,
                reason: 'Payment failed, stock released'
              }
            });
          }
        }
      });
      logger.info({ orderId: payment.orderId }, 'Webhook: Payment failed and stock released');
    }
  }
};
