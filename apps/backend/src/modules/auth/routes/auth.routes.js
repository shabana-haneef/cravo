import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import rateLimit from 'express-rate-limit';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { env } from '../../../config/env.js';

const router = Router();

// 1. Login & Registration (Credential Stuffing Protection)
const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MS,
  max: env.RATE_LIMIT_LOGIN_MAX,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_REGISTER_WINDOW_MS,
  max: env.RATE_LIMIT_REGISTER_MAX,
  message: { success: false, message: 'Too many accounts created from this IP. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. OTP & Email Limits (Financial / Spam Protection)
const otpLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_OTP_WINDOW_MS,
  max: env.RATE_LIMIT_OTP_MAX,
  message: { success: false, message: 'Too many OTP requests. Please try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. General Auth endpoints (e.g. refresh token, me)
// Refresh tokens are called on every page load / tab focus — keep generous.
const generalAuthLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, and token management
 */

// ==========================================
// Public Auth Endpoints
// ==========================================
/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, SELLER]
 *     responses:
 *       201:
 *         description: Successfully registered. Check email for verification code.
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/register', registerLimiter, authController.register);
router.post('/verify-email', otpLimiter, authController.verifyEmail);
router.post('/resend-otp', otpLimiter, authController.resendOtp);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login to the application
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 */
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
router.post('/logout', authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get('/me', protect, authController.me);

export default router;
