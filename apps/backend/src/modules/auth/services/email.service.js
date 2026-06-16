import { Resend } from "resend";

// Prevent server crash in local dev if RESEND_API_KEY is not set.
// A valid key must be added to .env for emails to actually send.
const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_dev';
const resend = new Resend(resendApiKey);

export const emailService = {
  /**
   * Sends a verification email containing the OTP
   */
  async sendVerificationEmail(to, otp) {
    try {
      console.log(`\n=========================================\n[DEV MODE] OTP for ${to}: ${otp}\n=========================================\n`);
      await resend.emails.send({
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
    } catch (error) {
      console.error("Failed to send verification email via Resend:", error.message);
    }
  },

  /**
   * Sends a password reset email containing the OTP
   */
  async sendPasswordResetEmail(to, otp) {
    try {
      console.log(`\n=========================================\n[DEV MODE] Password Reset OTP for ${to}: ${otp}\n=========================================\n`);
      await resend.emails.send({
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
    } catch (error) {
      // Do not throw the error to prevent leaking implementation details to client
      console.error("Failed to send password reset email via Resend:", error.message);
    }
  }
};
