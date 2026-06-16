import { ZodError } from "zod";

export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten(),
    });
  }

  const statusCode =
    error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      error.message ||
      "Internal Server Error",
  });
};