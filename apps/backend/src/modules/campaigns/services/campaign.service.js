import { campaignRepository } from '../repositories/campaign.repository.js';
import { sellerRepository } from '../../sellers/repositories/seller.repository.js';
import { shopRepository } from '../../shops/repositories/shop.repository.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import { razorpayService } from '../../payments/services/razorpay.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import prisma from '../../../lib/prisma.js';

export const campaignService = {
  async createCampaign(userId, data, file) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller || seller.status !== 'APPROVED') {
      throw new AppError("Only approved sellers can create campaigns", 403);
    }
    
    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop || shop.status !== 'ACTIVE') {
      throw new AppError("Active shop is required to run campaigns", 403);
    }

    let bannerUrl = data.bannerUrl || null;
    let bannerPublicId = null;

    if (file) {
      if (file.size > 5 * 1024 * 1024) throw new AppError("File size cannot exceed 5MB", 400);
      if (file.mimetype === 'image/svg+xml') throw new AppError("SVG files are not allowed", 400);
      
      const uploadResult = await cloudinaryService.uploadBuffer(file.buffer, 'cravo/campaigns');
      bannerUrl = uploadResult.secure_url;
      bannerPublicId = uploadResult.public_id;
    } else if (!bannerUrl) {
      throw new AppError("Banner image or URL is required", 400);
    }

    const campaign = await campaignRepository.create({
      sellerId: seller.id,
      shopId: shop.id,
      name: data.name,
      type: data.type,
      targetProductIds: data.targetProductIds || [],
      destinationUrl: data.destinationUrl,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'PENDING_PAYMENT',
      bannerUrl,
      bannerPublicId
    });

    // Generate Razorpay Order
    const razorpayOrder = await razorpayService.createOrder(data.budget, `camp_${campaign.id}`);

    await campaignRepository.createPayment({
      campaignId: campaign.id,
      razorpayOrderId: razorpayOrder.id,
      amount: data.budget,
      status: 'PENDING'
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        targetType: 'CAMPAIGN',
        targetId: campaign.id,
        actionType: 'CREATED',
        actorId: userId,
        actorEmail: 'seller@cravo.com', // Typically from context, but we will simplify
        actorRole: 'SELLER'
      }
    });

    return { campaign, razorpayOrder };
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

      const updatedCampaign = await campaignRepository.update(campaignId, {
        status: 'PENDING_APPROVAL'
      }, tx);

      await campaignRepository.addStatusHistory(campaignId, 'PENDING_APPROVAL', userId, "Payment successful", tx);

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
