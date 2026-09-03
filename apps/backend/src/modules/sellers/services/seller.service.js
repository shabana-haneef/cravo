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
import { maskAccountNumber } from '../../../shared/utils/masking.js';
import { otpService } from '../../auth/services/otp.service.js';
import { emailService } from '../../auth/services/email.service.js';

export const sellerService = {
  /**
   * Applies a user to be a seller
   */
  async applyAsSeller(userId, data, files) {
    const govSettings = await governanceSettingsService.get();
    if (!govSettings.allowNewSellerApplications) {
      throw new AppError("New seller applications are currently disabled.", 400);
    }

    const requiresDocs = govSettings.requireSellerDocumentVerification;
    if (requiresDocs && (!files.idProof)) {
      throw new AppError("ID Proof is required.", 400);
    }

    // Collect public IDs for cleanup in case of TX failure
    const publicIdsToClean = [];

    // Process files sequentially to Cloudinary
    const uploadTasks = [];
    
    let profilePhotoUrl = null;
    if (files.profilePhoto && files.profilePhoto[0]) {
      const res = await cloudinaryService.uploadBuffer(files.profilePhoto[0].buffer, 'cravo/users/profiles');
      profilePhotoUrl = res.secure_url;
      if (res.public_id) publicIdsToClean.push(res.public_id);
    }
    
    if (files.idProof) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.idProof[0].buffer, 'cravo/sellers/documents/id')
          .then(res => {
            if (res.public_id) publicIdsToClean.push(res.public_id);
            return { type: 'ID_PROOF', fileUrl: res.secure_url, publicId: res.public_id };
          })
      );
    }

    let shopLogoUrl = null;
    let shopLogoId = null;
    if (files.shopLogo && files.shopLogo[0]) {
      const res = await cloudinaryService.uploadBuffer(files.shopLogo[0].buffer, 'cravo/sellers/documents/shop');
      shopLogoUrl = res.secure_url;
      shopLogoId = res.public_id;
      if (res.public_id) publicIdsToClean.push(res.public_id);
    }

    let shopBannerUrl = null;
    let shopBannerId = null;
    if (files.shopBanner && files.shopBanner[0]) {
      const res = await cloudinaryService.uploadBuffer(files.shopBanner[0].buffer, 'cravo/sellers/documents/shop_banner');
      shopBannerUrl = res.secure_url;
      shopBannerId = res.public_id;
      if (res.public_id) publicIdsToClean.push(res.public_id);
    }

    if (files.fssaiLicense && files.fssaiLicense[0]) {
      const fssaiOptions = files.fssaiLicense[0].mimetype === 'application/pdf' ? { format: 'jpg' } : {};
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.fssaiLicense[0].buffer, 'cravo/sellers/documents/fssai', fssaiOptions)
          .then(res => {
            if (res.public_id) publicIdsToClean.push(res.public_id);
            return { type: 'FSSAI_LICENSE', fileUrl: res.secure_url, publicId: res.public_id };
          })
      );
    }

    const uploadedDocs = await Promise.all(uploadTasks);

    const initialStatus = govSettings.requireSellerApproval ? 'PENDING' : 'APPROVED';

    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Acquire row-level lock on User to serialize concurrent submissions
        await tx.$executeRawUnsafe('SELECT id FROM "User" WHERE id = $1 FOR UPDATE', userId);

        // 2. Fetch existing application safely from inside the locked transaction
        // Using raw SQL to completely bypass Prisma soft-delete middleware, 
        // ensuring we see ANY existing seller record (even soft-deleted ones)
        // that would trigger a P2002 Unique Constraint violation.
        const existingRaw = await tx.$queryRawUnsafe('SELECT id, status, "deletedAt" FROM "Seller" WHERE "userId" = $1', userId);
        
        if (existingRaw && existingRaw.length > 0) {
          const app = existingRaw[0];
          const isSoftDeleted = app.deletedAt !== null;
          
          if (app.status === 'REJECTED' || isSoftDeleted) {
            if (app.status === 'REJECTED' && !isSoftDeleted && !govSettings.allowSellerReapplication) {
              throw new AppError("Seller reapplication is disabled.", 400);
            }
            
            // Clean up the old application records (whether rejected or soft-deleted)
            await tx.$executeRawUnsafe('DELETE FROM "SellerDocument" WHERE "sellerId" = $1', app.id);
            await tx.$executeRawUnsafe('DELETE FROM "BankAccount" WHERE "sellerId" = $1', app.id);
            
            // For Shop, bypass soft-delete middleware as well
            const existingShopRaw = await tx.$queryRawUnsafe('SELECT id FROM "Shop" WHERE "sellerId" = $1', app.id);
            if (existingShopRaw && existingShopRaw.length > 0) {
              const shopId = existingShopRaw[0].id;
              await tx.$executeRawUnsafe('DELETE FROM "ShopTiming" WHERE "shopId" = $1', shopId);
              await tx.$executeRawUnsafe('DELETE FROM "Shop" WHERE id = $1', shopId);
            }
            
            await tx.$executeRawUnsafe('DELETE FROM "Seller" WHERE id = $1', app.id);
          } else {
            // Already submitted (PENDING or APPROVED) and not soft-deleted
            throw new AppError("You have already submitted a seller application.", 409);
          }
        }

        // Update User Profile if fullName, phone, or profilePhoto is provided
        const profileUpdates = {};
        if (data.fullName) profileUpdates.fullName = data.fullName;
        if (data.mobileNumber) profileUpdates.phone = data.mobileNumber;
        if (profilePhotoUrl) profileUpdates.avatar = profilePhotoUrl;
        
        if (Object.keys(profileUpdates).length > 0) {
          const profile = await tx.profile.findUnique({ where: { userId } });
          if (!profile) {
            await tx.profile.create({
              data: {
                userId,
                ...profileUpdates
              }
            });
          } else {
            await tx.profile.update({
              where: { userId },
              data: profileUpdates
            });
          }
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
      }, { maxWait: 10000, timeout: 20000 });
    } catch (error) {
      // Clean up orphaned Cloudinary files if the database transaction fails
      if (publicIdsToClean.length > 0) {
        Promise.all(
          publicIdsToClean.map(id => cloudinaryService.deleteFile(id).catch(e => console.error(`Failed to cleanup Cloudinary asset ${id}`, e)))
        ).catch(() => {});
      }
      throw error;
    }
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
  },

  /**
   * Fetch Payout Settings for a seller securely
   */
  async getPayoutSettings(userId) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!seller) throw new AppError("Seller profile not found", 404);

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { sellerId: seller.id }
    });

    if (!bankAccount) return null;

    // Mask account number
    const maskedAccount = maskAccountNumber(bankAccount.accountNumber);

    // Log verification for debugging
    import('../../../shared/services/logger.js').then(module => {
      module.logger.info({
        authenticatedUser: userId,
        resolvedSellerId: seller.id,
        bankAccountSellerId: bankAccount.sellerId,
        message: 'Payout data requested'
      });
    });

    return {
      accountHolderName: bankAccount.accountHolderName,
      bankName: bankAccount.bankName,
      accountNumberMasked: maskedAccount,
      accountNumber: bankAccount.accountNumber,
      ifsc: bankAccount.ifsc,
      verificationStatus: 'verified' // Could be dynamic if verification states are added
    };
  },

  /**
   * Request an OTP to update payout settings
   */
  async requestPayoutUpdateOtp(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) throw new AppError("User not found", 404);

    const otp = otpService.generateOtp();
    const hashedOtp = await otpService.hashOtp(otp);
    const key = `bank-update:${userId}`;
    
    // Save to Redis with 5 minutes TTL (300 seconds)
    await otpService.saveOtp(key, hashedOtp, 300);

    // Send email
    await emailService.sendBankAccountUpdateEmail(user.email, otp);

    return { success: true, message: "OTP sent to registered email" };
  },

  /**
   * Verify OTP and update payout settings
   */
  async verifyAndUpdatePayoutSettings(userId, otp, bankData) {
    const key = `bank-update:${userId}`;
    const isValid = await otpService.verifyOtp(key, otp);

    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!seller) throw new AppError("Seller profile not found", 404);

    // Update the bank account
    const updatedBank = await prisma.bankAccount.upsert({
      where: { sellerId: seller.id },
      update: {
        accountHolderName: bankData.accountHolderName,
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        ifsc: bankData.ifsc,
        branchName: bankData.branchName || 'Not specified'
      },
      create: {
        sellerId: seller.id,
        accountHolderName: bankData.accountHolderName,
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        ifsc: bankData.ifsc,
        branchName: bankData.branchName || 'Not specified'
      }
    });

    // Invalidate the OTP so it can't be reused
    await otpService.deleteOtp(key);

    import('../../../shared/services/logger.js').then(module => {
      module.logger.info({
        userId,
        sellerId: seller.id,
        event: 'BANK_ACCOUNT_UPDATED_VIA_OTP'
      });
    });

    return updatedBank;
  },

  /**
   * Get Notification Preferences
   */
  async getNotificationPreferences(userId) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId } // Uses defaults from schema
      });
    }

    return prefs;
  },

  /**
   * Update Notification Preferences
   */
  async updateNotificationPreferences(userId, data) {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        orderEmails: data.orderEmails,
        inventoryAlerts: data.inventoryAlerts,
        payoutEmails: data.payoutEmails,
        marketingEmails: data.marketingEmails,
        securityAlerts: true // Always force true for security
      },
      create: {
        userId,
        orderEmails: data.orderEmails ?? true,
        inventoryAlerts: data.inventoryAlerts ?? true,
        payoutEmails: data.payoutEmails ?? true,
        marketingEmails: data.marketingEmails ?? false,
        securityAlerts: true
      }
    });
  },

  /**
   * Get Store Profile
   */
  async getStoreProfile(userId) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        shop: true,
        user: {
          include: { profile: true }
        }
      }
    });

    if (!seller) throw new AppError("Seller profile not found", 404);

    return {
      shopName: seller.shop?.name || seller.storeName || '',
      shopType: seller.shop?.shopType || seller.businessType || '',
      businessModel: seller.businessModel || 'Self-Operated', // Default to Self-Operated if missing
      shopDescription: seller.shop?.description || seller.storeDescription || '',
      fssaiNumber: seller.fssaiNumber || '',
      storeWebsite: seller.website || seller.storeWebsite || '',
      supportEmail: seller.supportEmail || '',
      isActive: seller.shop?.status === 'ACTIVE',
      locationName: seller.pickupLocationName || '',
      pickupPhone: seller.pickupPhone || seller.supportPhone || seller.user?.profile?.phone || '',
      streetAddress: seller.pickupAddress || '',
      city: seller.pickupCity || '',
      state: seller.pickupState || '',
      pincode: seller.pickupPincode || '',
      enableSelfPickup: seller.shop?.isPickupEnabled ?? false,
      enableHomeDelivery: seller.shop?.isDeliveryEnabled ?? false,
      deliveryRadius: seller.shop?.deliveryRadiusKm || 5,
      logoImage: seller.shop?.logoUrl || null,
      bannerImage: seller.shop?.bannerUrl || null,
      
      // Onboarding Business Info
      businessName: seller.businessName || '',
      businessType: seller.businessType || '',
      businessAddressLine1: seller.businessAddressLine1 || '',
      businessAddressLine2: seller.businessAddressLine2 || '',
      businessCity: seller.businessCity || '',
      businessState: seller.businessState || '',
      businessPincode: seller.businessPincode || '',
      businessCountry: seller.businessCountry || 'India'
    };
  },

  /**
   * Update Store Profile
   */
  async updateStoreProfile(userId, data) {
    return await prisma.$transaction(async (tx) => {
      const seller = await tx.seller.findUnique({
        where: { userId },
        include: { shop: true }
      });

      if (!seller) throw new AppError("Seller profile not found", 404);

      // Update Seller pickup info & business info
      await tx.seller.update({
        where: { id: seller.id },
        data: {
          pickupLocationName: data.locationName,
          pickupPhone: data.pickupPhone,
          pickupAddress: data.streetAddress,
          pickupCity: data.city,
          pickupState: data.state,
          pickupPincode: data.pincode,
          storeName: data.shopName,
          storeDescription: data.shopDescription,
          businessModel: data.businessModel,
          fssaiNumber: data.fssaiNumber,
          storeWebsite: data.storeWebsite,
          supportEmail: data.supportEmail,

          // Business Details
          businessName: data.businessName,
          businessType: data.businessType,
          businessAddressLine1: data.businessAddressLine1,
          businessAddressLine2: data.businessAddressLine2,
          businessCity: data.businessCity,
          businessState: data.businessState,
          businessPincode: data.businessPincode,
          businessCountry: data.businessCountry
        }
      });

      // Update Shop info
      if (seller.shop) {
        await tx.shop.update({
          where: { id: seller.shop.id },
          data: {
            name: data.shopName,
            description: data.shopDescription,
            isPickupEnabled: data.enableSelfPickup,
            isDeliveryEnabled: data.enableHomeDelivery,
            deliveryRadiusKm: parseInt(data.deliveryRadius) || 5,
            status: data.isActive ? 'ACTIVE' : 'INACTIVE',
            logoUrl: data.logoImage,
            bannerUrl: data.bannerImage
          }
        });
      }

      return { success: true };
    });
  }
};
