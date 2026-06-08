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