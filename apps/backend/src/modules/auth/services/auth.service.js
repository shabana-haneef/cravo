import { userRepository } from '../../users/repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { hashPassword, comparePassword } from '../../../shared/utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../../shared/utils/jwt.js';
import { otpService } from './otp.service.js';
import { emailService } from './email.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { env } from '../../../config/env.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { profileRepository } from '../../users/repositories/profile.repository.js';
import prisma from '../../../lib/prisma.js';

// Utility to quickly hash refresh tokens for DB storage without bcrypt overhead
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authService = {
  // ==========================================
  // Registration & Verification Flow
  // ==========================================
  
  async register(email, password) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Registration failed. Please check your details or try logging in.", 400);
    }

    const hashedPassword = await hashPassword(password);
    
    const userCount = await userRepository.count();
    const assignedRole = userCount === 0 ? 'ADMIN' : 'CUSTOMER';

    const user = await userRepository.create({
      email,
      passwordHash: hashedPassword,
      role: assignedRole,
      status: 'ACTIVE',
      isEmailVerified: false
    });

    const plainOtp = otpService.generateOtp();
    const hashedOtp = await otpService.hashOtp(plainOtp);
    await otpService.saveOtp(`email-verification:${user.id}`, hashedOtp);
    
    await emailService.sendVerificationEmail(user.email, plainOtp);
    
    return { userId: user.id, email: user.email };
  },

  async verifyEmail(email, otp) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError("Invalid or expired OTP", 400); 
    if (user.isEmailVerified) throw new AppError("Email is already verified", 400);

    const isValid = await otpService.verifyOtp(`email-verification:${user.id}`, otp);
    if (!isValid) throw new AppError("Invalid or expired OTP", 400);

    await userRepository.update(user.id, { isEmailVerified: true });
    await otpService.deleteOtp(`email-verification:${user.id}`);
    
    return true;
  },

  async resendOtp(email) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.isEmailVerified) return; 

    const plainOtp = otpService.generateOtp();
    const hashedOtp = await otpService.hashOtp(plainOtp);
    await otpService.saveOtp(`email-verification:${user.id}`, hashedOtp);

    await emailService.sendVerificationEmail(user.email, plainOtp);
  },

  // ==========================================
  // Password Recovery Flow
  // ==========================================

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    
    // Fails silently to prevent user enumeration
    if (!user) return; 

    const plainOtp = otpService.generateOtp();
    const hashedOtp = await otpService.hashOtp(plainOtp);
    
    // Store with 10-minute expiry
    await otpService.saveOtp(`password-reset:${user.id}`, hashedOtp);

    await emailService.sendPasswordResetEmail(user.email, plainOtp);
  },

  async resetPassword(email, otp, newPassword) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    const isValid = await otpService.verifyOtp(`password-reset:${user.id}`, otp);
    
    if (!isValid) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    
    await userRepository.update(user.id, { passwordHash: hashedPassword });
    await otpService.deleteOtp(`password-reset:${user.id}`);

    // Critical Security: Invalidate all active sessions globally to kick out any compromised devices
    await refreshTokenRepository.deleteByUser(user.id);
  },

  async resendResetOtp(email) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) return; // Fails silently

    const plainOtp = otpService.generateOtp();
    const hashedOtp = await otpService.hashOtp(plainOtp);
    await otpService.saveOtp(`password-reset:${user.id}`, hashedOtp);

    await emailService.sendPasswordResetEmail(user.email, plainOtp);
  },

  // ==========================================
  // Session Management Flow
  // ==========================================

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError("Invalid credentials", 401);

    if (!user.passwordHash) {
      throw new AppError("Invalid credentials", 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) throw new AppError("Invalid credentials", 401);

    if (user.status === 'SUSPENDED') throw new AppError("Your account has been suspended", 403);
    if (user.status === 'INACTIVE') throw new AppError("Your account is inactive", 403);
    if (!user.isEmailVerified) throw new AppError("Please verify your email address to continue", 403);

    const isFirstLogin = !user.lastLoginAt;
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    const payload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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
        isEmailVerified: user.isEmailVerified,
        isFirstLogin
      },
      accessToken,
      refreshToken
    };
  },

  async refreshToken(rawRefreshToken) {
    if (!rawRefreshToken) throw new AppError("Refresh token is required", 401);

    let decoded;
    try {
      decoded = verifyToken(rawRefreshToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingToken = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingToken) {
      await refreshTokenRepository.deleteByUser(decoded.id);
      throw new AppError("Invalid token family. All sessions revoked for security.", 401);
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || user.status !== 'ACTIVE' || !user.isEmailVerified) {
      throw new AppError("User account is no longer active", 403);
    }

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

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
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
  },

  // ==========================================
  // Google Authentication Flow
  // ==========================================

  async continueWithGoogle(idToken) {
    if (!idToken) throw new AppError("Google token is required", 400);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new AppError("Invalid Google token", 401);
    }

    if (!payload.email_verified) {
      throw new AppError("Google email is not verified", 403);
    }

    let user = await userRepository.findByEmail(payload.email);
    
    if (user) {
      // Account linking
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub }
        });
        
        await prisma.auditLog.create({
          data: {
            actionType: "ACCOUNT_LINKED_GOOGLE",
            actorId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            targetType: "User",
            targetId: user.id,
            ipAddress: "System",
            userAgent: "GoogleAuthService",
          }
        });
      }
      
      if (user.status === 'SUSPENDED') throw new AppError("Your account has been suspended", 403);
      if (user.status === 'INACTIVE') throw new AppError("Your account is inactive", 403);
    } else {
      // New user creation
      user = await prisma.user.create({
        data: {
          email: payload.email,
          passwordHash: null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          googleId: payload.sub,
          isEmailVerified: true
        }
      });
      
      await prisma.auditLog.create({
        data: {
          actionType: "GOOGLE_REGISTRATION",
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          targetType: "User",
          targetId: user.id,
          ipAddress: "System",
          userAgent: "GoogleAuthService",
        }
      });
    }

    // Safe Profile Management
    const existingProfile = await profileRepository.findByUserId(user.id);
    if (!existingProfile) {
      await profileRepository.upsertProfile(user.id, {
        fullName: payload.name || payload.given_name,
        avatar: payload.picture
      });
    } else if (!existingProfile.avatar && payload.picture) {
      // Update avatar only if appropriate (missing)
      await profileRepository.upsertProfile(user.id, {
        ...existingProfile,
        avatar: payload.picture
      });
    }

    const isFirstLogin = !user.lastLoginAt;
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    const tokenPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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
        isEmailVerified: user.isEmailVerified,
        isFirstLogin
      },
      accessToken,
      refreshToken
    };
  }
};
