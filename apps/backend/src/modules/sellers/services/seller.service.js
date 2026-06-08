import { sellerRepository } from '../repositories/seller.repository.js';
import { sellerDocumentRepository } from '../repositories/sellerDocument.repository.js';
import { userRepository } from '../../users/repositories/user.repository.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const sellerService = {
  /**
   * Applies a user to be a seller
   */
  async applyAsSeller(userId, data, files) {
    const existing = await sellerRepository.findByUserId(userId);
    if (existing) {
      throw new AppError("You have already submitted a seller application.", 400);
    }

    if (!files.idProof || !files.addressProof) {
      throw new AppError("ID Proof and Address Proof are required.", 400);
    }

    // Process files sequentially to Cloudinary
    const uploadTasks = [];
    
    uploadTasks.push(
      cloudinaryService.uploadBuffer(files.idProof[0].buffer, 'cravo/sellers/documents/id')
        .then(res => ({ type: 'ID_PROOF', fileUrl: res.secure_url, publicId: res.public_id }))
    );
    
    uploadTasks.push(
      cloudinaryService.uploadBuffer(files.addressProof[0].buffer, 'cravo/sellers/documents/address')
        .then(res => ({ type: 'ADDRESS_PROOF', fileUrl: res.secure_url, publicId: res.public_id }))
    );

    if (files.shopImage && files.shopImage[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.shopImage[0].buffer, 'cravo/sellers/documents/shop')
          .then(res => ({ type: 'SHOP_IMAGE', fileUrl: res.secure_url, publicId: res.public_id }))
      );
    }

    const uploadedDocs = await Promise.all(uploadTasks);

    // Save transactionally
    return prisma.$transaction(async (tx) => {
      const seller = await sellerRepository.create({
        userId,
        bio: data.bio || null,
        status: 'PENDING'
      }, tx);

      const docsToInsert = uploadedDocs.map(doc => ({
        ...doc,
        sellerId: seller.id
      }));

      await sellerDocumentRepository.createMany(docsToInsert, tx);
      
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

    return prisma.$transaction(async (tx) => {
      // 1. Update seller status
      const updatedSeller = await sellerRepository.updateStatus(sellerId, 'APPROVED', {
        approvedAt: new Date(),
        rejectionReason: null
      }, tx);

      // 2. Promote user to SELLER role
      await userRepository.update(application.userId, { role: 'SELLER' }, tx);

      return updatedSeller;
    });
  },

  /**
   * Admin: Reject Application
   */
  async rejectApplication(sellerId, reason) {
    if (!reason) throw new AppError("Rejection reason is required", 400);

    const application = await sellerRepository.findById(sellerId);
    if (!application) throw new AppError("Application not found", 404);
    if (application.status === 'REJECTED') throw new AppError("Application is already rejected", 400);

    return sellerRepository.updateStatus(sellerId, 'REJECTED', {
      rejectionReason: reason
    });
  }
};
