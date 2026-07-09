import { ZodError } from "zod";

import { logger } from "../services/logger.js";

export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  if (error instanceof ZodError) {
    logger.warn({ error: error.flatten(), url: req.originalUrl }, "Validation failed");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten(),
    });
  }

  const statusCode =
    error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error({ err: error, url: req.originalUrl, method: req.method }, "Internal Server Error");
  } else {
    logger.warn({ err: error, url: req.originalUrl }, error.message);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      error.message ||
      "Internal Server Error",
  });
};