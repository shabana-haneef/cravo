import { z } from 'zod';

export const checkoutSchema = z.object({
  addressId: z.string().cuid("Invalid address ID")
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay Signature is required")
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
});
