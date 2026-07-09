import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import rateLimit from 'express-rate-limit';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// 1. Login & Registration (Credential Stuffing Protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true, // Returns RateLimit-* headers
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per IP per hour
  message: { success: false, message: 'Too many accounts created from this IP. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. OTP & Email Limits (Financial / Spam Protection)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per IP per hour
  message: { success: false, message: 'Too many OTP requests. Please try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. General Auth endpoints (e.g. refresh token, me)
const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 50,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// Public Auth Endpoints
// ==========================================
router.post('/register', registerLimiter, authController.register);
router.post('/verify-email', otpLimiter, authController.verifyEmail);
router.post('/resend-otp', otpLimiter, authController.resendOtp);

router.post('/login', loginLimiter, authController.login);
router.post('/google', loginLimiter, authController.googleAuth);
router.post('/refresh-token', generalAuthLimiter, authController.refreshToken); 

// ==========================================
// Password Recovery Endpoints
// ==========================================
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', otpLimiter, authController.resetPassword);
router.post('/resend-reset-otp', otpLimiter, authController.resendResetOtp);

// ==========================================
// Protected Auth Endpoints
// ==========================================
router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get('/me', protect, authController.me);

export default router;
