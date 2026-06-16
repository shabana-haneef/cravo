import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import routes from "./routes/v1/index.js";

import { notFound } from "./shared/middleware/notFound.middleware.js";
import { errorHandler } from "./shared/middleware/error.middleware.js";

// General API rate limiter — 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Strict limiter for auth endpoints — 20 requests per 15 minutes per IP
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 200,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   message: { success: false, message: 'Too many authentication attempts, please try again later.' }
// });

const app = express();

app.use(helmet());

app.use(compression());

app.use(
  cors({
    origin: true,
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

// Auth routes get a stricter rate limit (must be registered before generalLimiter)
// app.use("/api/v1/auth", authLimiter);

app.use(
  "/api/v1",
  generalLimiter,
  routes
);

app.use(notFound);

app.use(errorHandler);

export default app;