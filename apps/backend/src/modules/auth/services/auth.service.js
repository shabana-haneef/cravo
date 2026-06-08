import { userRepository } from '../../users/repositories/user.repository.js';
import { hashPassword } from '../../../shared/utils/password.js';
import { otpService } from './otp.service.js';
import { emailService } from './email.service.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const authService = {
  /**
   * Core logic for registering a new user
   */
  async register(email, password) {
    const existingUser = await userRepository.findByEmail(email);
    
    if (existingUser) {
      // Use generic error to prevent user enumeration attacks
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

  /**
   * Verifies the email using the provided OTP
   */
  async verifyEmail(email, otp) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Generic error
      throw new AppError("Invalid or expired OTP", 400); 
    }

    if (user.isEmailVerified) {
      throw new AppError("Email is already verified", 400);
    }

    const isValid = await otpService.validateOtp(user.id, otp);
    
    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Update the database securely
    await userRepository.update(user.id, { isEmailVerified: true });
    
    // Cleanup Redis to prevent any possibility of replay
    await otpService.deleteOtp(user.id);

    return true;
  },

  /**
   * Resends the OTP only if the user is unverified
   */
  async resendOtp(email) {
    const user = await userRepository.findByEmail(email);
    
    // Fail silently with generic success response at the controller level
    // This prevents user enumeration (attackers finding out which emails exist)
    if (!user || user.isEmailVerified) {
      return; 
    }

    const plainOtp = await otpService.createAndStoreOtp(user.id);
    await emailService.sendVerificationEmail(user.email, plainOtp);
  }
};
