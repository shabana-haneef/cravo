import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

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

  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  // Handle Prisma Database Errors securely
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400; // Client-side bad request for known Prisma errors
    if (error.code === 'P2002') {
      message = "A record with this information already exists.";
    } else {
      message = "A database constraint was violated.";
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Provided data is invalid.";
  } else if (
    error instanceof Prisma.PrismaClientUnknownRequestError || 
    error instanceof Prisma.PrismaClientInitializationError || 
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    statusCode = 500;
    message = "An unexpected database error occurred. Please try again later.";
  }

  // Mask internal 500 server errors
  if (statusCode >= 500) {
    logger.error({ err: error, url: req.originalUrl, method: req.method }, "Internal Server Error");
    message = "An unexpected server error occurred. Please try again later.";
  } else {
    logger.warn({ err: error, url: req.originalUrl }, message);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};