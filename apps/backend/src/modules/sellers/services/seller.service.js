import { sellerRepository } from '../repositories/seller.repository.js';
import { sellerDocumentRepository } from '../repositories/sellerDocument.repository.js';
import { userRepository } from '../../users/repositories/user.repository.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import { notificationService } from '../../notifications/services/notification.service.js';
import { governanceSettingsService } from '../../admin/services/governanceSettings.service.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const sellerService = {
  /**
   * Applies a user to be a seller
   */
  async applyAsSeller(userId, data, files) {
    const govSettings = await governanceSettingsService.get();
    if (!govSettings.allowNewSellerApplications) {
      throw new AppError("New seller applications are currently disabled.", 400);
    }

    const existing = await sellerRepository.findByUserId(userId);
    if (existing) {
      if (existing.status === 'REJECTED') {
        if (!govSettings.allowSellerReapplication) {
          throw new AppError("Seller reapplication is disabled.", 400);
        }
        await prisma.$transaction(async (tx) => {
          await tx.sellerDocument.deleteMany({ where: { sellerId: existing.id } });
          await tx.seller.delete({ where: { id: existing.id } });
        });
      } else {
        throw new AppError("You have already submitted a seller application.", 400);
      }
    }

    const requiresDocs = govSettings.requireSellerDocumentVerification;
    if (requiresDocs && (!files.idProof || !files.addressProof)) {
      throw new AppError("ID Proof and Address Proof are required.", 400);
    }

    // Process files sequentially to Cloudinary
    const uploadTasks = [];
    
    if (files.idProof) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.idProof[0].buffer, 'cravo/sellers/documents/id')
          .then(res => ({ type: 'ID_PROOF', fileUrl: res.secure_url, publicId: res.public_id }))
      );
    }
    
    if (files.addressProof) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.addressProof[0].buffer, 'cravo/sellers/documents/address')
          .then(res => ({ type: 'ADDRESS_PROOF', fileUrl: res.secure_url, publicId: res.public_id }))
      );
    }

    if (files.shopImage && files.shopImage[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.shopImage[0].buffer, 'cravo/sellers/documents/shop')
          .then(res => ({ type: 'SHOP_IMAGE', fileUrl: res.secure_url, publicId: res.public_id }))
      );
    }

    if (files.fssaiLicense && files.fssaiLicense[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.fssaiLicense[0].buffer, 'cravo/sellers/documents/fssai')
          .then(res => ({ type: 'FSSAI_LICENSE', fileUrl: res.secure_url, publicId: res.public_id }))
      );
    }

    const uploadedDocs = await Promise.all(uploadTasks);

    // Save transactionally
    const initialStatus = govSettings.requireSellerApproval ? 'PENDING' : 'APPROVED';

    return prisma.$transaction(async (tx) => {
      const seller = await sellerRepository.create({
        userId,
        bio: data.bio || null,
        status: initialStatus,
        approvedAt: initialStatus === 'APPROVED' ? new Date() : null
      }, tx);

      if (uploadedDocs.length > 0) {
        const docsToInsert = uploadedDocs.map(doc => ({
          ...doc,
          sellerId: seller.id
        }));
        await sellerDocumentRepository.createMany(docsToInsert, tx);
      }

      if (initialStatus === 'APPROVED') {
        await userRepository.update(userId, { role: 'SELLER' }, tx);
      }
      
      return seller;
    });
  },

  /**
   * Get application status (IDOR protected)
   */
  async getApplicationStatus(userId) {
    const application = await sellerRepository.findByUserId(userId);
    if (!application) {
      throw new AppError("No application found.", 404);
    }
    return application;
  },

  /**
   * Admin: List all applications
   */
  async listApplications(status) {
    return sellerRepository.listApplications(status);
  },

  /**
   * Admin: Get application by ID
   */
  async getApplicationById(id) {
    const application = await sellerRepository.findById(id);
    if (!application) throw new AppError("Application not found", 404);
    return application;
  },

  /**
   * Admin: Approve Application
   */
  async approveApplication(sellerId) {
    const application = await sellerRepository.findById(sellerId);
    if (!application) throw new AppError("Application not found", 404);
    if (application.status === 'APPROVED') throw new AppError("Application is already approved", 400);

    const updatedSeller = await prisma.$transaction(async (tx) => {
      // 1. Update seller status
      const result = await sellerRepository.updateStatus(sellerId, 'APPROVED', {
        approvedAt: new Date(),
        rejectionReason: null
      }, tx);

      // 2. Promote user to SELLER role
      await userRepository.update(application.userId, { role: 'SELLER' }, tx);

      return result;
    });

    // Notify the user (fire-and-forget) — runs AFTER transaction commits
    notificationService.createAndEmit(
      application.userId,
      'SELLER_APPROVED',
      'Seller Application Approved 🎉',
      'Congratulations! Your seller application has been approved. You can now set up your shop and start selling.',
      { sellerId }
    ).catch(() => {});

    return updatedSeller;
  },

  /**
   * Admin: Reject Application
   */
  async rejectApplication(sellerId, reason) {
    if (!reason) throw new AppError("Rejection reason is required", 400);

    const application = await sellerRepository.findById(sellerId);
    if (!application) throw new AppError("Application not found", 404);
    if (application.status === 'REJECTED') throw new AppError("Application is already rejected", 400);

    const result = await sellerRepository.updateStatus(sellerId, 'REJECTED', {
      rejectionReason: reason
    });

    // Notify the user (fire-and-forget)
    notificationService.createAndEmit(
      application.userId,
      'SELLER_REJECTED',
      'Seller Application Update',
      `Unfortunately, your seller application has been rejected. Reason: ${reason}`,
      { sellerId }
    ).catch(() => {});

    return result;
  }
};
