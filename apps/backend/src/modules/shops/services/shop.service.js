import { shopRepository } from '../repositories/shop.repository.js';
import { shopTimingRepository } from '../repositories/shopTiming.repository.js';
import { sellerRepository } from '../../sellers/repositories/seller.repository.js';
import { slugService } from './slug.service.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const shopService = {
  async createShop(userId, data, files) {
    // 1. Get seller record
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) throw new AppError("Seller account not found", 404);
    if (seller.status !== 'APPROVED') throw new AppError("Only approved sellers can create a shop", 403);

    // 2. Check if shop already exists
    const existingShop = await shopRepository.findBySellerId(seller.id);
    if (existingShop) throw new AppError("You already have a shop", 400);

    // 3. Generate Slug
    const slug = await slugService.generateUniqueSlug(data.name);

    // 4. Handle Uploads
    let logoUrl = null;
    let logoPublicId = null;
    let bannerUrl = null;
    let bannerPublicId = null;

    const uploadTasks = [];
    if (files?.logo && files.logo[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.logo[0].buffer, 'cravo/shops/logos')
          .then(res => { logoUrl = res.secure_url; logoPublicId = res.public_id; })
      );
    }
    if (files?.banner && files.banner[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.banner[0].buffer, 'cravo/shops/banners')
          .then(res => { bannerUrl = res.secure_url; bannerPublicId = res.public_id; })
      );
    }

    await Promise.all(uploadTasks);

    // 5. Transaction
    return prisma.$transaction(async (tx) => {
      const shop = await shopRepository.create({
        sellerId: seller.id,
        slug,
        name: data.name,
        description: data.description || null,
        shopType: data.shopType,
        deliveryRadiusKm: data.deliveryRadiusKm,
        isPickupEnabled: data.isPickupEnabled,
        isDeliveryEnabled: data.isDeliveryEnabled,
        logoUrl,
        logoPublicId,
        bannerUrl,
        bannerPublicId,
        status: 'ACTIVE'
      }, tx);

      // Create default blank timings for 7 days
      const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      const blankTimings = days.map(day => ({
        dayOfWeek: day,
        isClosed: true
      }));

      await shopTimingRepository.upsertMany(shop.id, blankTimings, tx);

      return shop;
    });
  },

  async getMyShop(userId) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) throw new AppError("Seller not found", 404);

    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop) throw new AppError("Shop not found", 404);

    return shop;
  },

  async updateShop(userId, data, files) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) throw new AppError("Seller not found", 404);

    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop) throw new AppError("Shop not found", 404);

    let updates = { ...data };

    const uploadTasks = [];
    if (files?.logo && files.logo[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.logo[0].buffer, 'cravo/shops/logos')
          .then(res => { updates.logoUrl = res.secure_url; updates.logoPublicId = res.public_id; })
      );
    }
    if (files?.banner && files.banner[0]) {
      uploadTasks.push(
        cloudinaryService.uploadBuffer(files.banner[0].buffer, 'cravo/shops/banners')
          .then(res => { updates.bannerUrl = res.secure_url; updates.bannerPublicId = res.public_id; })
      );
    }

    if (uploadTasks.length > 0) {
      await Promise.all(uploadTasks);
    }

    return shopRepository.update(shop.id, updates);
  },

  async updateTimings(userId, timings) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) throw new AppError("Seller not found", 404);

    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop) throw new AppError("Shop not found", 404);

    await shopTimingRepository.upsertMany(shop.id, timings);
    return true;
  },

  async getPublicShop(slug) {
    const shop = await shopRepository.findBySlug(slug);
    if (!shop || shop.status !== 'ACTIVE') throw new AppError("Shop not found", 404);

    // Auto-generate badges
    const badges = [];
    if (shop.shopType === 'HOME_MADE') badges.push('Homemade');
    else if (shop.shopType === 'FARMER') badges.push('Farm Fresh');
    else if (shop.shopType === 'LOCAL_SHOP') badges.push('Local Seller');

    return {
      ...shop,
      badges
    };
  }
};
