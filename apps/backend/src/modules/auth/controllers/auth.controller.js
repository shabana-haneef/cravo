import { authService } from '../services/auth.service.js';
import { registerSchema, verifyEmailSchema, resendOtpSchema } from '../validators/auth.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';

export const authController = {
  async register(req, res, next) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors[0].message, 400);
      }

      const { email, password } = parsed.data;
      
      // Log carefully: NEVER log the plaintext password
      logger.info({ email }, 'Registration attempt started');
      
      await authService.register(email, password);

      logger.info({ email }, 'Registration successful, OTP generated and sent');

      return successResponse(
        res,
        'Registration successful. Please check your email for the verification code.',
        null,
        201
      );
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'Registration failed');
      next(error);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const parsed = verifyEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors[0].message, 400);
      }

      const { email, otp } = parsed.data;

      // Log carefully: NEVER log the plaintext OTP
      logger.info({ email }, 'Email verification attempt started');

      await authService.verifyEmail(email, otp);

      logger.info({ email }, 'Email verification successful');

      return successResponse(res, 'Email verified successfully. You can now log in.');
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'Email verification failed');
      next(error);
    }
  },

  async resendOtp(req, res, next) {
    try {
      const parsed = resendOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors[0].message, 400);
      }

      const { email } = parsed.data;
      
      logger.info({ email }, 'OTP resend attempt started');

      await authService.resendOtp(email);

      logger.info({ email }, 'OTP resend request processed');

      // Generic success to prevent enumeration
      return successResponse(res, 'If your email is registered and unverified, a new OTP has been sent.');
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'OTP resend failed');
      next(error);
    }
  }
};
