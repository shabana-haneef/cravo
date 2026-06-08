import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,

  databaseUrl: process.env.DATABASE_URL,

  redisUrl: process.env.REDIS_URL,

  accessSecret: process.env.JWT_ACCESS_SECRET,

  refreshSecret: process.env.JWT_REFRESH_SECRET,
};