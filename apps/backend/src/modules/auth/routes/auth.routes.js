import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import rateLimit from 'express-rate-limit';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// Robust Rate Limiting to prevent brute-force attacks and abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Max 10 attempts per IP
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// Public Auth Endpoints
// ==========================================
router.post('/register', authLimiter, authController.register);
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post('/resend-otp', authLimiter, authController.resendOtp);

router.post('/login', authLimiter, authController.login);

// Refresh Token usually happens implicitly in the background for active users, 
// so applying the strict 10/15min rate limit could inadvertently block normal app usage.
router.post('/refresh-token', authController.refreshToken);

// ==========================================
// Protected Auth Endpoints
// ==========================================
router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get('/me', protect, authController.me);

export default router;
