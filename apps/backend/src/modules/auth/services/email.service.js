import { Resend } from "resend";

// Resend client is initialized using the RESEND_API_KEY from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  /**
   * Sends a verification email containing the OTP
   * @param {string} to - Recipient email address
   * @param {string} otp - The 6-digit OTP
   */
  async sendVerificationEmail(to, otp) {
    try {
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
      // We don't throw the error upwards to prevent leaking Resend implementation details
      // Logging should be handled by the caller or global error handler
      console.error("Failed to send email via Resend:", error.message);
    }
  }
};
