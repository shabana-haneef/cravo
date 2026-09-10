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

  async createRefund(paymentId, amount, receipt, idempotencyKey) {
    // We use native fetch to ensure X-Refund-Idempotency header is passed accurately
    // as older Razorpay SDKs may not natively expose custom headers in the refund method.
    const url = `https://api.razorpay.com/v1/payments/${paymentId}/refund`;
    const options = {
      amount: Math.round(amount * 100),
      receipt,
      speed: "normal"
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET).toString('base64')
    };

    if (idempotencyKey) {
      headers['X-Refund-Idempotency'] = idempotencyKey;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(options)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.description || "Refund API failed");
      }
      return data;
    } catch (error) {
      throw new AppError(`Failed to create Razorpay refund: ${error.message}`, 500);
    }
  },

  async getRefund(refundId) {
    const instance = this.getInstance();
    try {
      return await instance.refunds.fetch(refundId);
    } catch (error) {
      throw new AppError("Failed to fetch Razorpay refund", 500);
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
