import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../../../shared/errors/AppError.js';
import { env } from '../../../config/env.js'; // Wait, let's just use process.env if we don't have env.js exported correctly, but I assume they have standard env config.

export const razorpayService = {
  getInstance() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Razorpay keys are missing from environment", 500);
    }
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  },

  async createOrder(amount, receipt) {
    const instance = this.getInstance();
    
    // Amount should be in smallest currency unit (paise for INR)
    const options = {
      amount: Math.round(amount * 100), 
      currency: "INR",
      receipt
    };

    try {
      const order = await instance.orders.create(options);
      return order;
    } catch (error) {
      throw new AppError("Failed to create Razorpay order", 500);
    }
  },

  verifySignature(razorpayOrderId, razorpayPaymentId, signature) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Razorpay secret is missing from environment", 500);
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === signature;
  },

  verifyWebhookSignature(body, signature) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }
};
