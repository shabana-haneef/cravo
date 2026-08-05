import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "./config/redis.js";
import routes from "./routes/v1/index.js";
import delhiveryRoutes from "./modules/delivery/routes/delhivery.routes.js";
import seoRoutes from "./modules/seo/routes/seo.routes.js";

import { notFound } from "./shared/middleware/notFound.middleware.js";
import { errorHandler } from "./shared/middleware/error.middleware.js";
import { bullBoardRouter } from "./shared/utils/bullBoard.js";
import { protect } from "./shared/middleware/auth.middleware.js";
import { allowRoles } from "./shared/middleware/role.middleware.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

// General API rate limiter — 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
    prefix: 'rl:general:'
  })
});


const app = express();

// Required for rate-limiting behind Vercel/Nginx/Load Balancers
app.set('trust proxy', 1);

app.use(helmet());

import { requestLoggerMiddleware } from "./shared/services/logger.js";
app.use(requestLoggerMiddleware);

app.use(compression());

// Parse allowed origins from environment variable, fallback to localhost for dev
const allowedOrigins = process.env.FRONTEND_URLS 
  ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      // If the origin exists, it MUST strictly match the explicit allowlist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Reject all other origins
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Cravo API Running",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));

app.get("/ready", async (req, res) => {
  try {
    // Check DB
    const { prisma } = await import("./config/prisma.js");
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis
    if (!redis.isOpen) throw new Error("Redis is not connected");
    
    res.status(200).json({ status: "OK", database: "connected", redis: "connected" });
  } catch (error) {
    res.status(503).json({ status: "ERROR", message: error.message });
  }
});



// Bull Board UI (Admin Only)
app.use("/api/admin/queues", protect, allowRoles('ADMIN'), bullBoardRouter);

app.use(
  "/api/v1",
  generalLimiter,
  routes
);

app.use(
  "/api/delhivery",
  generalLimiter,
  delhiveryRoutes
);

app.use(
  "/api/seo",
  seoRoutes
);

app.use(notFound);

app.use(errorHandler);

export default app;