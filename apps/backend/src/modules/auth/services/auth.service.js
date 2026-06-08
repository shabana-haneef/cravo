import { userRepository } from '../../users/repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { hashPassword, comparePassword } from '../../../shared/utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../../shared/utils/jwt.js';
import { otpService } from './otp.service.js';
import { emailService } from './email.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { env } from '../../../config/env.js';
import crypto from 'crypto';

// Utility to quickly hash refresh tokens for DB storage without bcrypt overhead
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const authService = {
  // ==========================================
  // Registration Flow
  // ==========================================
  
  async register(email, password) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Registration failed. Please check your details or try logging in.", 400);
    }

    const hashedPassword = await hashPassword(password);
    
    const user = await userRepository.create({
      email,
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isEmailVerified: false
    });

    const plainOtp = await otpService.createAndStoreOtp(user.id);
    await emailService.sendVerificationEmail(user.email, plainOtp);
    
    return {
      userId: user.id,
      email: user.email
    };
  },

  async verifyEmail(email, otp) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError("Invalid or expired OTP", 400); 
    if (user.isEmailVerified) throw new AppError("Email is already verified", 400);

    const isValid = await otpService.validateOtp(user.id, otp);
    if (!isValid) throw new AppError("Invalid or expired OTP", 400);

    await userRepository.update(user.id, { isEmailVerified: true });
    await otpService.deleteOtp(user.id);
    return true;
  },

  async resendOtp(email) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.isEmailVerified) return; 
    const plainOtp = await otpService.createAndStoreOtp(user.id);
    await emailService.sendVerificationEmail(user.email, plainOtp);
  },

  // ==========================================
  // Session Management Flow
  // ==========================================

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    // Security Checks
    if (user.status === 'SUSPENDED') {
      throw new AppError("Your account has been suspended", 403);
    }

    if (user.status === 'INACTIVE') {
      throw new AppError("Your account is inactive", 403);
    }

    if (!user.isEmailVerified) {
      throw new AppError("Please verify your email address to continue", 403);
    }

    // Update login timestamp
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    // Issue Tokens
    const payload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Persist refresh token securely
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified
      },
      accessToken,
      refreshToken
    };
  },

  async refreshToken(rawRefreshToken) {
    if (!rawRefreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    let decoded;
    try {
      decoded = verifyToken(rawRefreshToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingToken = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingToken) {
      // Automatic Reuse Detection: Someone tried to use a revoked token
      // We nuke all sessions for this user to protect them
      await refreshTokenRepository.deleteByUser(decoded.id);
      throw new AppError("Invalid token family. All sessions revoked for security.", 401);
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || user.status !== 'ACTIVE' || !user.isEmailVerified) {
      throw new AppError("User account is no longer active", 403);
    }

    // Token Rotation (Invalidate old, issue new)
    await refreshTokenRepository.deleteByTokenHash(tokenHash);

    const payload = { id: user.id, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const newHash = hashRefreshToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: newHash,
      expiresAt
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  },

  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await refreshTokenRepository.deleteByTokenHash(tokenHash);
  },

  async logoutAll(userId) {
    await refreshTokenRepository.deleteByUser(userId);
  },

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified
    };
  }
};
