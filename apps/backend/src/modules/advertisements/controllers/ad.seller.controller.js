import prisma from '../../../lib/prisma.js';
import { successResponse } from '../../../shared/responses/apiResponse.js';
import { AppError } from '../../../shared/errors/AppError.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../../config/env.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';

let razorpayInstance = null;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export const adSellerController = {
  /**
   * List active ad packages for sellers to purchase
   */
  async getPackages(req, res, next) {
    try {
      const packages = await prisma.adPackage.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      });
      return successResponse(res, 'Packages retrieved', packages);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create an Ad Order (initiates Razorpay checkout)
   */
  async createAdOrder(req, res, next) {
    try {
      const { packageId, title, targetUrl } = req.body;
      let imageUrl = req.body.imageUrl;
      const userId = req.user.id;

      if (req.file) {
        const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, 'advertisements');
        imageUrl = uploadResult.secure_url;
      }

      if (!imageUrl) {
        throw new AppError("Image file or URL is required", 400);
      }

      // Ensure seller profile exists
      const seller = await prisma.seller.findUnique({ where: { userId } });
      if (!seller) throw new AppError("Seller profile not found", 404);
      if (seller.status !== 'APPROVED') throw new AppError("Seller account must be approved to run ads", 403);

      const adPackage = await prisma.adPackage.findUnique({ where: { id: packageId } });
      if (!adPackage) throw new AppError("Ad Package not found", 404);

      if (!razorpayInstance) {
        throw new AppError("Payment gateway not configured", 500);
      }

      // 1. Create Razorpay order
      const orderOptions = {
        amount: Math.round(adPackage.price * 100), // convert to paise
        currency: 'INR',
        receipt: `ad_${seller.id}_${Date.now()}`
      };
      
      const razorpayOrder = await razorpayInstance.orders.create(orderOptions);

      // 2. Create Advertisement as PENDING_PAYMENT transactionally
      const ad = await prisma.advertisement.create({
        data: {
          title,
          imageUrl,
          targetUrl,
          sellerId: seller.id,
          packageId: adPackage.id,
          status: 'PENDING_PAYMENT',
          payment: {
            create: {
              razorpayOrderId: razorpayOrder.id,
              amount: adPackage.price,
              status: 'PENDING'
            }
          }
        }
      });

      return successResponse(res, 'Order created successfully', {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        advertisementId: ad.id
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify Razorpay Payment and submit Ad for approval
   */
  async verifyPaymentAndSubmit(req, res, next) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, advertisementId } = req.body;

      if (!env.RAZORPAY_KEY_SECRET) {
        throw new AppError("Payment gateway not configured", 500);
      }

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new AppError("Invalid payment signature", 400);
      }

      // Update payment and ad status
      const updatedAd = await prisma.$transaction(async (tx) => {
        await tx.adPayment.update({
          where: { razorpayOrderId: razorpay_order_id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'SUCCESS'
          }
        });

        return tx.advertisement.update({
          where: { id: advertisementId },
          data: { status: 'PENDING_APPROVAL' }
        });
      });

      return successResponse(res, 'Payment verified and ad submitted for approval', updatedAd);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List seller's own ads
   */
  async getMyAds(req, res, next) {
    try {
      const userId = req.user.id;
      const seller = await prisma.seller.findUnique({ where: { userId } });
      if (!seller) return successResponse(res, 'Ads retrieved', []); // No seller profile yet

      const ads = await prisma.advertisement.findMany({
        where: { sellerId: seller.id },
        include: { package: true, payment: true },
        orderBy: { createdAt: 'desc' }
      });

      return successResponse(res, 'Ads retrieved', ads);
    } catch (error) {
      next(error);
    }
  }
};
