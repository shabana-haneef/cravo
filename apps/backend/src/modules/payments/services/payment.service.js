import { paymentRepository } from '../repositories/payment.repository.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { razorpayService } from './razorpay.service.js';
import { notificationService } from '../../notifications/services/notification.service.js';
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

    // 3. Strict Amount and Currency Verification
    const rzpPayment = await razorpayService.getPayment(razorpayPaymentId);
    
    const expectedAmountPaise = Math.round(payment.amount * 100);
    if (rzpPayment.amount !== expectedAmountPaise) {
      logger.error({ 
        userId, orderId: payment.orderId, expected: expectedAmountPaise, received: rzpPayment.amount 
      }, 'SECURITY ALERT: Payment amount mismatch');
      throw new AppError("Payment verification failed: Amount mismatch", 400);
    }

    if (rzpPayment.currency !== 'INR') {
      logger.error({ 
        userId, orderId: payment.orderId, expected: 'INR', received: rzpPayment.currency 
      }, 'SECURITY ALERT: Currency mismatch');
      throw new AppError("Payment verification failed: Currency mismatch", 400);
    }

    if (rzpPayment.order_id !== razorpayOrderId) {
      logger.error({ 
        userId, orderId: payment.orderId, expected: razorpayOrderId, received: rzpPayment.order_id 
      }, 'SECURITY ALERT: Order ID mismatch');
      throw new AppError("Payment verification failed: Order ID mismatch", 400);
    }

    if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
       throw new AppError("Payment verification failed: Invalid status from gateway", 400);
    }

    // 4. Update Statuses Atomically
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'SUCCESS'
        }
      });

      if (updateResult.count === 0) {
        return { message: "Payment already verified" };
      }

      await tx.order.updateMany({
        where: { id: payment.orderId, status: 'PENDING_PAYMENT' },
        data: { status: 'PLACED' }
      });
      
      logger.info({ userId, orderId: payment.orderId, razorpayPaymentId }, 'Payment successful and order placed');

      // Notify seller about new order (fire-and-forget)
      const order = payment.order;
      if (order?.shop?.seller?.userId) {
        notificationService.createAndEmit(
          order.shop.seller.userId,
          'ORDER_PLACED',
          'New Order Received! 🛍️',
          `Order #${order.orderNumber} has been placed. Amount: ₹${order.grandTotal.toFixed(2)}`,
          { orderId: payment.orderId, orderNumber: order.orderNumber }
        ).catch(() => {});
      }

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
      // Strict Amount and Currency Verification
      const expectedAmountPaise = Math.round(payment.amount * 100);
      
      if (payload.amount !== expectedAmountPaise || payload.currency !== 'INR') {
        logger.error({ 
          orderId: payment.orderId, 
          expectedAmount: expectedAmountPaise, 
          receivedAmount: payload.amount,
          receivedCurrency: payload.currency
        }, 'SECURITY ALERT: Webhook payment amount/currency mismatch');
        return; // Ignore fraudulent webhook payload
      }

      let isDuplicate = false;
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: {
            razorpayPaymentId: payload.id,
            status: 'SUCCESS'
          }
        });
        
        if (updateResult.count === 0) {
          isDuplicate = true;
          return; // Ignore duplicate/retried webhook
        }
        
        await tx.order.updateMany({
          where: { id: payment.orderId, status: 'PENDING_PAYMENT' },
          data: { status: 'PLACED' }
        });
      });
      
      if (isDuplicate) return;
      
      logger.info({ orderId: payment.orderId }, 'Webhook: Payment captured');

      // Notify seller (fire-and-forget)
      const capturedOrder = await orderRepository.findById(payment.orderId);
      if (capturedOrder?.shop?.seller?.userId) {
        notificationService.createAndEmit(
          capturedOrder.shop.seller.userId,
          'ORDER_PLACED',
          'New Order Received! 🛍️',
          `Order #${capturedOrder.orderNumber} has been placed. Amount: ₹${capturedOrder.grandTotal.toFixed(2)}`,
          { orderId: payment.orderId, orderNumber: capturedOrder.orderNumber }
        ).catch(() => {});
      }
    }

    if (event === 'payment.failed' && payment.status === 'PENDING') {
      let isDuplicate = false;
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: {
            razorpayPaymentId: payload.id,
            status: 'FAILED'
          }
        });
        
        if (updateResult.count === 0) {
          isDuplicate = true;
          return;
        }

        await tx.order.updateMany({
          where: { id: payment.orderId, status: 'PENDING_PAYMENT' },
          data: { status: 'CANCELLED' }
        });
        
        // Release reserved stock back to available using Atomic SQL Updates
        const order = await orderRepository.findById(payment.orderId);
        for (const item of order.items) {
          const invUpdateResult = await tx.inventory.updateMany({
            where: { 
              productVariantId: item.productVariantId,
              reservedStock: { gte: item.quantity }
            },
            data: {
              availableStock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });
          
          if (invUpdateResult.count > 0) {
            const inventory = await tx.inventory.findUnique({ where: { productVariantId: item.productVariantId } });
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
      if (isDuplicate) return;
      logger.info({ orderId: payment.orderId }, 'Webhook: Payment failed and stock released');
    }
  }
};
