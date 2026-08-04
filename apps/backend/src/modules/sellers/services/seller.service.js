import { sellerRepository } from '../repositories/seller.repository.js';
import { sellerDocumentRepository } from '../repositories/sellerDocument.repository.js';
import { userRepository } from '../../users/repositories/user.repository.js';
import { profileRepository } from '../../users/repositories/profile.repository.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import { notificationService } from '../../notifications/services/notification.service.js';
import { governanceSettingsService } from '../../admin/services/governanceSettings.service.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import crypto from 'crypto';

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
          await tx.bankAccount.deleteMany({ where: { sellerId: existing.id } });
          await tx.seller.delete({ where: { id: existing.id } });
        });
      } else {
        throw new AppError("You have already submitted a seller application.", 400);
      }
    }

    const requiresDocs = govSettings.requireSellerDocumentVerification;
    if (requiresDocs && (!files.idProof)) {
      throw new AppError("ID Proof is required.", 400);
    }

    // Process files sequentially to Cloudinary
    const uploadTasks = [];
    
    // Profile Photo
    let profilePhotoUrl = null;
    if (files.profilePhoto && files.profilePhoto[0]) {
      const res = await cloudinaryService.uploadBuffer(files.profilePhoto[0].buffer, 'cravo/users/profiles');
      profilePhotoUrl = res.secure_url;
    }
    
    if (files.idProof) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.idProof[0].buffer, 'cravo/sellers/documents/id')
          .then(res => ({ type: 'ID_PROOF', fileUrl: res.secure_url, publicId: res.public_id }))
      );
    }

    let shopLogoUrl = null;
    let shopLogoId = null;
    if (files.shopLogo && files.shopLogo[0]) {
      const res = await cloudinaryService.uploadBuffer(files.shopLogo[0].buffer, 'cravo/sellers/documents/shop');
      shopLogoUrl = res.secure_url;
      shopLogoId = res.public_id;
    }

    let shopBannerUrl = null;
    let shopBannerId = null;
    if (files.shopBanner && files.shopBanner[0]) {
      const res = await cloudinaryService.uploadBuffer(files.shopBanner[0].buffer, 'cravo/sellers/documents/shop_banner');
      shopBannerUrl = res.secure_url;
      shopBannerId = res.public_id;
    }

    if (files.fssaiLicense && files.fssaiLicense[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.fssaiLicense[0].buffer, 'cravo/sellers/documents/fssai')
          .then(res => ({ type: 'FSSAI_LICENSE', fileUrl: res.secure_url, publicId: res.public_id }))
      );
    }

    const uploadedDocs = await Promise.all(uploadTasks);

    const initialStatus = govSettings.requireSellerApproval ? 'PENDING' : 'APPROVED';

    return prisma.$transaction(async (tx) => {
      // Update User Profile if fullName, phone, or profilePhoto is provided
      const profileUpdates = {};
      if (data.fullName) profileUpdates.fullName = data.fullName;
      if (data.mobileNumber) profileUpdates.phone = data.mobileNumber;
      if (profilePhotoUrl) profileUpdates.avatar = profilePhotoUrl;
      
      if (Object.keys(profileUpdates).length > 0) {
        await tx.profile.update({
          where: { userId },
          data: profileUpdates
        });
      }

      // Parse JSON fields
      let socialLinks = [];
      let businessHours = [];
      try {
        if (data.socialLinks) socialLinks = JSON.parse(data.socialLinks);
        if (data.businessHours) businessHours = JSON.parse(data.businessHours);
      } catch (e) {
        // ignore parse error
      }

      // Create Seller record
      const seller = await tx.seller.create({
        data: {
          userId,
          status: initialStatus,
          approvedAt: initialStatus === 'APPROVED' ? new Date() : null,
          bio: data.storeDescription || null,
          
          businessName: data.businessName,
          businessType: data.businessType,
          fssaiNumber: data.fssaiNumber,
          businessAddressLine1: data.businessAddressLine1,
          businessAddressLine2: data.businessAddressLine2,
          businessCity: data.businessCity,
          businessState: data.businessState,
          businessPincode: data.businessPincode,
          businessCountry: data.businessCountry,
          
          pickupLocationName: data.pickupLocationName,
          pickupAddress: data.pickupAddress,
          pickupCity: data.pickupCity,
          pickupState: data.pickupState,
          pickupPincode: data.pickupPincode,
          
          storeName: data.storeName,
          storeDescription: data.storeDescription,
          storeWebsite: data.storeWebsite,
          socialLinks: socialLinks,
          supportEmail: data.supportEmail,
          supportPhone: data.supportPhone,
          businessHours: businessHours,
          
          // Store logo/banner in shop until approved (if Shop creation is deferred)
          // Wait, we can just save it to Shop immediately with PENDING status!
        }
      });

      // Create BankAccount
      if (data.accountHolderName && data.bankName && data.accountNumber && data.ifsc && data.branchName) {
        await tx.bankAccount.create({
          data: {
            sellerId: seller.id,
            accountHolderName: data.accountHolderName,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            ifsc: data.ifsc,
            branchName: data.branchName
          }
        });
      }

      // Create Documents
      if (uploadedDocs.length > 0) {
        const docsToInsert = uploadedDocs.map(doc => ({
          ...doc,
          sellerId: seller.id
        }));
        await tx.sellerDocument.createMany({ data: docsToInsert });
      }

      // Save Shop images in docs just in case, or directly create the PENDING shop here.
      // Since Shop creation is deferred to approval step, we need a way to store Logo/Banner.
      // We will create the Shop right now but with PENDING_APPROVAL status if possible, 
      // OR we just create a ShopDocument type. Wait, we can't create Shop right now if we want Shop deferred.
      // Let's create the Shop immediately but set its status to INACTIVE.
      // And in approveApplication, we set it to ACTIVE.
      const slug = data.storeName ? data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(3).toString('hex') : 'shop-' + seller.id;
      
      const shop = await tx.shop.create({
        data: {
          sellerId: seller.id,
          name: data.storeName || data.businessName || 'My Shop',
          slug: slug,
          description: data.storeDescription,
          logoUrl: shopLogoUrl,
          logoPublicId: shopLogoId,
          bannerUrl: shopBannerUrl,
          bannerPublicId: shopBannerId,
          shopType: 'OTHER', // Default or derived from businessType
          status: initialStatus === 'APPROVED' ? 'ACTIVE' : 'INACTIVE', // hidden until approved
          website: data.storeWebsite,
          socialLinks: socialLinks,
          supportEmail: data.supportEmail,
          supportPhone: data.supportPhone,
          businessHours: businessHours
        }
      });

      // Create ShopTimings
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      const timingsData = days.map(d => ({
        shopId: shop.id,
        dayOfWeek: d,
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: false
      }));
      await tx.shopTiming.createMany({ data: timingsData });

      if (initialStatus === 'APPROVED') {
        await tx.user.update({ where: { id: userId }, data: { role: 'SELLER' } });
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
    // Need custom query to include everything
    const application = await prisma.seller.findUnique({
      where: { id },
      include: {
        documents: true,
        bankAccount: true,
        shop: true,
        user: {
          select: {
            email: true,
            id: true,
            profile: true
          }
        }
      }
    });
    if (!application) throw new AppError("Application not found", 404);
    return application;
  },

  /**
   * Admin: Approve Application
   */
  async approveApplication(sellerId) {
    const application = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { shop: true }
    });
    
    if (!application) throw new AppError("Application not found", 404);
    if (application.status === 'APPROVED') throw new AppError("Application is already approved", 400);

    const updatedSeller = await prisma.$transaction(async (tx) => {
      // 1. Update seller status
      const result = await tx.seller.update({
        where: { id: sellerId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          rejectionReason: null
        }
      });

      // 2. Promote user to SELLER role
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'SELLER' }
      });

      // 3. Activate the shop
      if (application.shop) {
        await tx.shop.update({
          where: { id: application.shop.id },
          data: { status: 'ACTIVE' }
        });
      }

      return result;
    });

    // Notify the user (fire-and-forget)
    notificationService.createAndEmit(
      application.userId,
      'SELLER_APPROVED',
      'Seller Application Approved 🎉',
      'Congratulations! Your seller application has been approved. You can now access your shop dashboard.',
      { sellerId }
    ).catch(() => {});

    return updatedSeller;
  },

  /**
   * Admin: Reject Application
   */
  async rejectApplication(sellerId, reason) {
    if (!reason) throw new AppError("Rejection reason is required", 400);

    const application = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!application) throw new AppError("Application not found", 404);
    if (application.status === 'REJECTED') throw new AppError("Application is already rejected", 400);

    const result = await prisma.seller.update({
      where: { id: sellerId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
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
