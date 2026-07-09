import { Resend } from "resend";
import { env } from "../../../config/env.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { logger } from "../../../shared/services/logger.js";

const resend = new Resend(env.RESEND_API_KEY);

export const emailService = {
  /**
   * Sends a verification email containing the OTP
   */
  async sendVerificationEmail(to, otp) {
    try {
      const { error } = await resend.emails.send({
        from: "Cravo Security <security@cravo.example.com>", // Replace with your verified domain
        to,
        subject: "Verify your Cravo account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Cravo!</h2>
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address. This OTP is valid for 10 minutes.</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>If you did not request this, please safely ignore this email.</p>
          </div>
        `,
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to send verification email via Resend");
      throw new AppError("Failed to send verification email. Please try again later.", 500);
    }
  },

  /**
   * Sends a password reset email containing the OTP
   */
  async sendPasswordResetEmail(to, otp) {
    try {
      const { error } = await resend.emails.send({
        from: "Cravo Security <security@cravo.example.com>", // Replace with your verified domain
        to,
        subject: "Reset your Cravo password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Use the following code to reset it. This code is valid for 10 minutes.</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>If you did not request a password reset, please safely ignore this email. Your password will remain unchanged.</p>
          </div>
        `,
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to send password reset email via Resend");
      throw new AppError("Failed to send password reset email. Please try again later.", 500);
    }
  }
};
