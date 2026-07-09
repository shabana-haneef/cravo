import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";
import crypto from "crypto";

export const loggerContext = new AsyncLocalStorage();

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "accessToken",
      "*.accessToken",
      "refreshToken",
      "*.refreshToken",
      "otp",
      "*.otp",
      "authorization",
      "cookie",
      "card_number",
      "cvv",
      "email",
      "*.email",
      "phone",
      "*.phone"
    ],
    censor: "[REDACTED]"
  },
  // Only use pino-pretty in development
  ...(isProduction ? {} : {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true
      }
    }
  }),
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  mixin() {
    const store = loggerContext.getStore();
    return { reqId: store?.reqId };
  }
});

// Middleware to inject Request ID
export const requestLoggerMiddleware = (req, res, next) => {
  const reqId = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", reqId);

  loggerContext.run({ reqId }, () => {
    // Log incoming request
    logger.info({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    }, "Incoming Request");

    // Optional: Log response finish (commented out by default to save noise, but good practice)
    /*
    res.on("finish", () => {
      logger.info({
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: ...
      }, "Request Completed");
    });
    */
    next();
  });
};