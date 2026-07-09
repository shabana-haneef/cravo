import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../../../shared/errors/AppError.js';
import { env } from '../../../config/env.js';

export const razorpayService = {
  getInstance() {
    return new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
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

  async getPayment(paymentId) {
    const instance = this.getInstance();
    try {
      return await instance.payments.fetch(paymentId);
    } catch (error) {
      throw new AppError("Failed to fetch Razorpay payment", 500);
    }
  },

  verifySignature(razorpayOrderId, razorpayPaymentId, signature) {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === signature;
  },

  verifyWebhookSignature(body, signature) {
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }
};
