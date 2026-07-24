import { campaignRepository } from '../repositories/campaign.repository.js';
import { sellerRepository } from '../../sellers/repositories/seller.repository.js';
import { shopRepository } from '../../shops/repositories/shop.repository.js';
import { productRepository } from '../../products/repositories/product.repository.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import { razorpayService } from '../../payments/services/razorpay.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { auditLogService } from '../../admin/services/auditLog.service.js';
import prisma from '../../../lib/prisma.js';

const CAMPAIGN_FEE = {
  PRODUCT_PROMOTION: 100,
  FLASH_SALE: 100,
  STOREWIDE_OFFER: { GO: 1000, PRO: 2000, PREMIUM: 5000 },
  DISCOUNT: { 25: 200, 50: 100, 75: 50 }
};

const CAMPAIGN_DURATION = {
  PRODUCT_PROMOTION: 7, // days
  FLASH_SALE: 1, // day
  STOREWIDE_OFFER: { GO: 7, PRO: 15, PREMIUM: 30 } // days
};

export const campaignService = {
  async _validateSellerAndShop(userId) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller || seller.status !== 'APPROVED') {
      throw new AppError("Only approved sellers can create campaigns", 403);
    }
    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop || shop.status !== 'ACTIVE') {
      throw new AppError("Active shop is required to run campaigns", 403);
    }
    return { seller, shop };
  },

  async _validateProduct(productId, shopId) {
    const product = await productRepository.findById(productId);
    if (!product || product.shopId !== shopId) {
      throw new AppError("Product not found or doesn't belong to you", 404);
    }
    if (product.status !== 'APPROVED') {
      throw new AppError("Only APPROVED products can be promoted", 400);
    }
    return product;
  },

  async _processBanner(file, fallbackUrl) {
    if (file) {
      if (file.size > 5 * 1024 * 1024) throw new AppError("File size cannot exceed 5MB", 400);
      if (file.mimetype === 'image/svg+xml') throw new AppError("SVG files are not allowed", 400);
      const uploadResult = await cloudinaryService.uploadBuffer(file.buffer, 'cravo/campaigns');
      return { bannerUrl: uploadResult.secure_url, bannerPublicId: uploadResult.public_id };
    }
    if (fallbackUrl) return { bannerUrl: fallbackUrl, bannerPublicId: null };
    return { bannerUrl: null, bannerPublicId: null };
  },

  async _createBaseCampaign(seller, shop, type, name, budget, startDate, endDate, targetProductIds, metadata, file, fallbackBannerUrl) {
    const { bannerUrl, bannerPublicId } = await this._processBanner(file, fallbackBannerUrl);

    if (type !== 'DISCOUNT_CAMPAIGN' && !bannerUrl) {
        throw new AppError("Banner image is required for this campaign type", 400);
    }

    const campaign = await campaignRepository.create({
      sellerId: seller.id,
      shopId: shop.id,
      name,
      type,
      targetProductIds,
      budget,
      startDate,
      endDate,
      status: 'PENDING_PAYMENT',
      bannerUrl,
      bannerPublicId,
      metadata // { package: 'PRO' } or { discount: 25 }
    });

    const razorpayOrder = await razorpayService.createOrder(budget, `camp_${campaign.id}`);

    await campaignRepository.createPayment({
      campaignId: campaign.id,
      razorpayOrderId: razorpayOrder.id,
      amount: budget,
      status: 'PENDING'
    });

    return { campaign, razorpayOrder };
  },

  async createProductPromotion(userId, data, file) {
    const { seller, shop } = await this._validateSellerAndShop(userId);
    const product = await this._validateProduct(data.productId, shop.id);

    // Prevent duplicate active campaigns for same product
    const existing = await prisma.campaign.findFirst({
      where: {
        shopId: shop.id,
        type: 'PRODUCT_PROMOTION',
        status: 'ACTIVE',
        targetProductIds: { has: data.productId }
      }
    });
    if (existing) throw new AppError("This product is already being promoted.", 400);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + CAMPAIGN_DURATION.PRODUCT_PROMOTION);

    const fallbackBannerUrl = product.images?.[0]?.imageUrl; // Use product image if no banner

    return this._createBaseCampaign(
      seller, shop, 'PRODUCT_PROMOTION', 
      `Promote: ${product.name}`, 
      CAMPAIGN_FEE.PRODUCT_PROMOTION, 
      startDate, endDate, 
      [product.id], null, file, fallbackBannerUrl
    );
  },

  async createStorewideOffer(userId, data, file) {
    const { seller, shop } = await this._validateSellerAndShop(userId);
    const packageType = data.packageType; // GO, PRO, PREMIUM
    
    if (!CAMPAIGN_FEE.STOREWIDE_OFFER[packageType]) {
        throw new AppError("Invalid package type selected", 400);
    }

    // Ensure only ONE active storewide offer
    const existing = await prisma.campaign.findFirst({
        where: { shopId: shop.id, type: 'STOREWIDE_OFFER', status: 'ACTIVE' }
    });
    if (existing) throw new AppError("You already have an active Storewide Offer. Please wait for it to expire or cancel it.", 400);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + CAMPAIGN_DURATION.STOREWIDE_OFFER[packageType]);

    const fallbackBannerUrl = shop.bannerUrl;

    return this._createBaseCampaign(
      seller, shop, 'STOREWIDE_OFFER', 
      `Storewide ${packageType} Package`, 
      CAMPAIGN_FEE.STOREWIDE_OFFER[packageType], 
      startDate, endDate, 
      [], { package: packageType }, file, fallbackBannerUrl
    );
  },

  async createDiscountCampaign(userId, data, file) {
    const { seller, shop } = await this._validateSellerAndShop(userId);
    const discount = parseInt(data.discountPercentage, 10);
    
    if (!CAMPAIGN_FEE.DISCOUNT[discount]) {
        throw new AppError("Invalid discount percentage. Choose 25, 50, or 75.", 400);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Default 7 days for discount

    return this._createBaseCampaign(
      seller, shop, 'DISCOUNT_CAMPAIGN', 
      `Storewide ${discount}% OFF`, 
      CAMPAIGN_FEE.DISCOUNT[discount], 
      startDate, endDate, 
      [], { discount }, file, null
    );
  },

  async createFlashSale(userId, data, file) {
    const { seller, shop } = await this._validateSellerAndShop(userId);
    const product = await this._validateProduct(data.productId, shop.id);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 24); // 24 hours

    const fallbackBannerUrl = product.images?.[0]?.imageUrl;

    return this._createBaseCampaign(
      seller, shop, 'FLASH_SALE', 
      `Flash Sale: ${product.name}`, 
      CAMPAIGN_FEE.FLASH_SALE, 
      startDate, endDate, 
      [product.id], null, file, fallbackBannerUrl
    );
  },

  async verifyPayment(userId, campaignId, paymentData) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData;

    const isValid = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) throw new AppError("Invalid payment signature", 400);

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign || campaign.payment?.razorpayOrderId !== razorpayOrderId) {
      throw new AppError("Invalid campaign or payment order", 400);
    }

    return prisma.$transaction(async (tx) => {
      await campaignRepository.updatePayment(campaignId, {
        razorpayPaymentId,
        razorpaySignature,
        status: 'SUCCESS'
      }, tx);

      // Instantly activate for paid promotions (no admin approval needed per plan)
      const updatedCampaign = await campaignRepository.update(campaignId, {
        status: 'ACTIVE' 
      }, tx);

      await campaignRepository.addStatusHistory(campaignId, 'ACTIVE', userId, "Payment successful - Campaign Auto-Activated", tx);

      await tx.auditLog.create({
        data: {
          targetType: 'CAMPAIGN',
          targetId: campaignId,
          actionType: 'PAYMENT_COMPLETED',
          actorId: userId,
          actorEmail: 'seller@cravo.com',
          actorRole: 'SELLER'
        }
      });

      return updatedCampaign;
    });
  },

  async getMyCampaigns(userId, page, limit) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) return { data: [], meta: { total: 0 } };
    return campaignRepository.findBySellerId(seller.id, page, limit);
  },

  async getPendingCampaigns(page, limit) {
    return campaignRepository.findPendingCampaigns(page, limit);
  },

  async approveCampaign(adminId, campaignId) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw new AppError("Campaign not found", 404);
    if (campaign.status !== 'PENDING_APPROVAL') throw new AppError("Campaign is not pending approval", 400);

    return prisma.$transaction(async (tx) => {
      const updated = await campaignRepository.update(campaignId, { status: 'APPROVED' }, tx);
      await campaignRepository.addStatusHistory(campaignId, 'APPROVED', adminId, null, tx);
      
      await tx.auditLog.create({
        data: {
          targetType: 'CAMPAIGN',
          targetId: campaignId,
          actionType: 'APPROVED',
          actorId: adminId,
          actorEmail: 'admin@cravo.com',
          actorRole: 'ADMIN'
        }
      });
      return updated;
    });
  },

  async rejectCampaign(adminId, campaignId, reason) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw new AppError("Campaign not found", 404);
    if (campaign.status !== 'PENDING_APPROVAL') throw new AppError("Campaign is not pending approval", 400);

    return prisma.$transaction(async (tx) => {
      const updated = await campaignRepository.update(campaignId, { status: 'REJECTED', rejectionReason: reason }, tx);
      await campaignRepository.addStatusHistory(campaignId, 'REJECTED', adminId, reason, tx);

      await tx.auditLog.create({
        data: {
          targetType: 'CAMPAIGN',
          targetId: campaignId,
          actionType: 'REJECTED',
          actorId: adminId,
          actorEmail: 'admin@cravo.com',
          actorRole: 'ADMIN'
        }
      });
      return updated;
    });
  },

  async pauseCampaign(userId, campaignId) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw new AppError("Campaign not found", 404);

    return prisma.$transaction(async (tx) => {
      const updated = await campaignRepository.update(campaignId, { status: 'PAUSED' }, tx);
      await campaignRepository.addStatusHistory(campaignId, 'PAUSED', userId, "Paused by user", tx);
      
      await tx.auditLog.create({
        data: {
          targetType: 'CAMPAIGN',
          targetId: campaignId,
          actionType: 'PAUSED',
          actorId: userId,
          actorEmail: 'seller@cravo.com',
          actorRole: 'SELLER'
        }
      });
      return updated;
    });
  },

  async resumeCampaign(userId, campaignId) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw new AppError("Campaign not found", 404);

    return prisma.$transaction(async (tx) => {
      const updated = await campaignRepository.update(campaignId, { status: 'ACTIVE' }, tx);
      await campaignRepository.addStatusHistory(campaignId, 'ACTIVE', userId, "Resumed by user", tx);
      
      await tx.auditLog.create({
        data: {
          targetType: 'CAMPAIGN',
          targetId: campaignId,
          actionType: 'RESUMED',
          actorId: userId,
          actorEmail: 'seller@cravo.com',
          actorRole: 'SELLER'
        }
      });
      return updated;
    });
  }
};
