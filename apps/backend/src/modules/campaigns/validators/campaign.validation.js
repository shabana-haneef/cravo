import { z } from 'zod';

export const productPromotionSchema = z.object({
  productId: z.string().min(1, "Product ID is required")
});

export const storewideOfferSchema = z.object({
  packageType: z.enum(['GO', 'PRO', 'PREMIUM'], { required_error: "Valid package type is required" })
});

export const discountCampaignSchema = z.object({
  discountPercentage: z.coerce.number().refine(val => [25, 50, 75].includes(val), "Discount must be 25, 50, or 75")
});

export const flashSaleSchema = z.object({
  productId: z.string().min(1, "Product ID is required")
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay Signature is required")
});
