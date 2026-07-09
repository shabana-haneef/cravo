import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string(),

  PORT: z.string(),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string(),

  JWT_ACCESS_SECRET: z
    .string()
    .min(10),

  JWT_REFRESH_SECRET: z
    .string()
    .min(10),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, "Cloudinary Name required"),
  CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API Key required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API Secret required"),

  RESEND_API_KEY: z.string().startsWith("re_", "Invalid Resend Key Format"),

  RAZORPAY_KEY_ID: z.string().min(1, "Razorpay Key ID required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "Razorpay Key Secret required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "Razorpay Webhook Secret required"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  FRONTEND_URLS: z.string().optional(),
});

const parsed =
  envSchema.safeParse(
    process.env
  );

if (!parsed.success) {
  console.error(
    parsed.error.flatten()
  );

  process.exit(1);
}

export const env =
  parsed.data;