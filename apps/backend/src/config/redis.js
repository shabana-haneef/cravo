import { createClient } from "redis";
import { logger } from "../shared/services/logger.js";

export const redis = createClient({
  url: process.env.REDIS_URL,
});

export const pubClient = redis.duplicate();
export const subClient = redis.duplicate();

redis.on("error", (err) => logger.error({ err }, "Redis Error"));
pubClient.on("error", (err) => logger.error({ err }, "Redis Pub Error"));
subClient.on("error", (err) => logger.error({ err }, "Redis Sub Error"));