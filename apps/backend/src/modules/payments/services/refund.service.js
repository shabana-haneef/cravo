import prisma from '../../../lib/prisma.js';
import { razorpayService } from './razorpay.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';

export const refundService = {
  async initiateRefund(paymentId, amount, reason, idempotencyKey) {
    if (!idempotencyKey) {
      throw new AppError('Idempotency key is required', 400);
    }

    // Use a transaction to serialize concurrent requests for the same payment
    return await prisma.$transaction(async (tx) => {
      // 1. Row-level lock on Payment to prevent race conditions during idempotency check
      const [payment] = await tx.$queryRaw`SELECT * FROM "public"."Payment" WHERE id = ${paymentId} FOR UPDATE`;

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status !== 'SUCCESS') {
        throw new AppError('Only successful payments can be refunded', 400);
      }

      if (!payment.razorpayPaymentId) {
        throw new AppError('Payment is missing Razorpay Payment ID', 400);
      }

      // 2. Database Idempotency Check: Look for an existing refund with this receipt/idempotencyKey
      const existingRefund = await tx.refund.findFirst({
        where: { 
          paymentId: payment.id,
          receipt: idempotencyKey 
        }
      });

      if (existingRefund) {
        logger.info({ paymentId, receipt: idempotencyKey, refundId: existingRefund.id }, 'Returning existing idempotent refund request');
        return existingRefund;
      }

      // 3. Amount Validation Check: Ensure we don't refund more than the original payment amount
      const existingRefundsAgg = await tx.refund.aggregate({
        where: { 
          paymentId: payment.id,
          status: { in: ['PENDING', 'PROCESSED'] } 
        },
        _sum: { amount: true }
      });

      const totalRefunded = Number(existingRefundsAgg._sum.amount || 0);
      const requestedAmount = Number(amount);
      const paymentAmount = Number(payment.amount);
      const remainingRefundable = paymentAmount - totalRefunded;

      if (requestedAmount > remainingRefundable) {
        throw new AppError(`Refund amount exceeds allowable balance. Maximum refundable: ${remainingRefundable}`, 400);
      }

      // 4. Create the Refund record as PENDING
      const refundRecord = await tx.refund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount,
          reason,
          receipt: idempotencyKey,
          status: 'PENDING'
        }
      });

      // 4. Execute Razorpay API call
      // Note: Executing network call inside transaction. 
      // This is acceptable here because we need the DB lock to be held to prevent
      // a concurrent request from bypassing the idempotency check while this API call is in flight.
      try {
        const razorpayResponse = await razorpayService.createRefund(
          payment.razorpayPaymentId,
          amount,
          idempotencyKey, // passed as receipt to Razorpay
          idempotencyKey  // passed as X-Refund-Idempotency
        );

        // Success - update local record with Razorpay's refund ID
        const updatedRefund = await tx.refund.update({
          where: { id: refundRecord.id },
          data: { razorpayRefundId: razorpayResponse.id }
        });

        logger.info({ paymentId, refundId: updatedRefund.id, razorpayRefundId: razorpayResponse.id }, 'Refund initiated successfully via API');
        
        // Status remains PENDING until webhook confirms it as PROCESSED
        return updatedRefund;
      } catch (error) {
        // Network or API failure. Razorpay might have processed it or might not have.
        // We DO NOT mark it FAILED. We keep it PENDING for webhook reconciliation.
        logger.error({ err: error.message, paymentId, idempotencyKey }, 'Refund API call threw an error. Leaving as PENDING for webhook reconciliation.');
        
        const updatedWithErr = await tx.refund.update({
          where: { id: refundRecord.id },
          data: { error: error.message }
        });
        
        return updatedWithErr;
      }
    });
  }
};
