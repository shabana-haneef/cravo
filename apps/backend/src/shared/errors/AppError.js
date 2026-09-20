export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = null
  ) {
    super(message);

    this.statusCode = statusCode;
    if (code) {
      this.code = code;
      this.errorCode = code; // Legacy support
    }
  }
}