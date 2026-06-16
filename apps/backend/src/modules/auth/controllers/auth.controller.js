import { authService } from '../services/auth.service.js';
import { 
  registerSchema, 
  verifyEmailSchema, 
  resendOtpSchema, 
  loginSchema, 
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, 
};

export const authController = {
  // ... Registration Flow ...
  async register(req, res, next) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { email, password } = parsed.data;
      logger.info({ email }, 'Registration attempt started');
      
      await authService.register(email, password);

      logger.info({ email }, 'Registration successful, OTP generated and sent');
      return successResponse(res, 'Registration successful. Please check your email for the verification code.', null, 201);
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'Registration failed');
      next(error);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const parsed = verifyEmailSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { email, otp } = parsed.data;
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
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { email } = parsed.data;
      logger.info({ email }, 'OTP resend attempt started');

      await authService.resendOtp(email);

      logger.info({ email }, 'OTP resend request processed');
      return successResponse(res, 'If your email is registered and unverified, a new OTP has been sent.');
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'OTP resend failed');
      next(error);
    }
  },

  // ==========================================
  // Password Recovery Flow
  // ==========================================

  async forgotPassword(req, res, next) {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { email } = parsed.data;
      logger.info({ email }, 'Password reset requested');

      await authService.forgotPassword(email);

      // We log completion without knowing if it actually succeeded inside to prevent enumeration
      logger.info({ email }, 'Password reset flow processed (if user existed)');
      
      // Generic zero-knowledge response
      return successResponse(res, 'If an account exists, a reset code has been sent.');
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'Password reset request failed');
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { email, otp, newPassword } = parsed.data;
      logger.info({ email }, 'Password reset attempt started');

      await authService.resetPassword(email, otp, newPassword);

      logger.info({ email }, 'Password reset completed successfully');
      
      return successResponse(res, 'Your password has been successfully reset. All active sessions have been logged out.');
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'Invalid reset attempt');
      next(error);
    }
  },

  async resendResetOtp(req, res, next) {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { email } = parsed.data;
      logger.info({ email }, 'Resend password reset OTP requested');

      await authService.resendResetOtp(email);

      logger.info({ email }, 'Resend password reset OTP processed');
      
      return successResponse(res, 'If an account exists, a new reset code has been sent.');
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'Resend reset OTP failed');
      next(error);
    }
  },

  // ==========================================
  // Session Management Flow
  // ==========================================

  async login(req, res, next) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const { email, password } = parsed.data;
      const { user, accessToken, refreshToken } = await authService.login(email, password);

      logger.info({ userId: user.id }, 'User logged in successfully');

      res.cookie('refreshToken', refreshToken, cookieOptions);
      return successResponse(res, 'Login successful', { user, accessToken });
    } catch (error) {
      logger.error({ email: req.body?.email, error: error.message }, 'Login failed');
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      let token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) return errorResponse(res, "Refresh token is required", 401);

      const { accessToken, refreshToken } = await authService.refreshToken(token);

      logger.info('Token refreshed successfully');
      res.cookie('refreshToken', refreshToken, cookieOptions);
      return successResponse(res, 'Token refreshed successfully', { accessToken });
    } catch (error) {
      res.clearCookie('refreshToken');
      logger.error({ error: error.message }, 'Token refresh failed');
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      let token = req.cookies?.refreshToken || req.body?.refreshToken;
      await authService.logout(token);
      res.clearCookie('refreshToken');
      
      logger.info('User logged out successfully');
      return successResponse(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user.id);
      res.clearCookie('refreshToken');
      
      logger.info({ userId: req.user.id }, 'User logged out of all devices');
      return successResponse(res, 'Logged out of all devices successfully');
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return successResponse(res, 'Current user retrieved', { user });
    } catch (error) {
      next(error);
    }
  }
};
