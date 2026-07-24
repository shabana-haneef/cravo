import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Only load dotenv explicitly in non-production, otherwise rely on environment
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url("Must be a valid Postgres connection string"),
  REDIS_URL: z.string().url("Must be a valid Redis connection string").default('redis://localhost:6379'),
  
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters long for security"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters long for security"),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  RAZORPAY_KEY_ID: z.string().min(1, "Razorpay Key ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "Razorpay Secret is required"),
  
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "Cloudinary cloud name is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API key is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API secret is required"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;