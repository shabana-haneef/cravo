import { productRepository } from '../repositories/product.repository.js';
import { productImageRepository } from '../repositories/productImage.repository.js';
import { productVariantRepository } from '../repositories/productVariant.repository.js';
import { categoryRepository } from '../../categories/repositories/category.repository.js';
import { shopRepository } from '../../shops/repositories/shop.repository.js';
import { sellerRepository } from '../../sellers/repositories/seller.repository.js';
import { slugService } from '../../shops/services/slug.service.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const productService = {
  async createProduct(userId, data, files) {
    // 1. Validate Seller and Shop
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller || seller.status !== 'APPROVED') throw new AppError("Only approved sellers can create products", 403);

    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop) throw new AppError("You do not have a shop profile. Please set up your shop first.", 400);
    if (shop.status !== 'ACTIVE') throw new AppError("Your shop is currently inactive or suspended.", 403);

    // 2. Validate Category
    const category = await categoryRepository.findById(data.categoryId);
    if (!category || !category.isActive) throw new AppError("Invalid or inactive category", 400);

    // 3. Handle Images
    if (!files || files.length === 0) throw new AppError("At least one product image is required", 400);
    if (files.length > 10) throw new AppError("Maximum 10 images allowed", 400);

    const uploadTasks = files.map((file) => 
      cloudinaryService.uploadBuffer(file.buffer, 'cravo/products')
    );
    const uploadedImages = await Promise.all(uploadTasks);

    // 4. Generate Slug
    let baseSlug = slugService.slugify(data.name);
    let slug = baseSlug;
    let count = 2;
    while (await productRepository.slugExists(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    // 5. Transaction
    return prisma.$transaction(async (tx) => {
      const product = await productRepository.create({
        shopId: shop.id,
        categoryId: category.id,
        name: data.name,
        slug,
        shortDescription: data.shortDescription,
        description: data.description,
        features: data.features || [],
        tags: data.tags || [],
        additionalInformation: data.additionalInformation,
        isFeatured: data.isFeatured,
        status: 'PENDING_APPROVAL'
      }, tx);

      // Create Images
      const imageRecords = uploadedImages.map((img, index) => ({
        productId: product.id,
        imageUrl: img.secure_url,
        publicId: img.public_id,
        sortOrder: index
      }));
      await productImageRepository.createMany(imageRecords, tx);

      // Create Initial Variant
      let variantSku = slugService.slugify(data.variantName);
      let vCount = 2;
      while(await productVariantRepository.skuExists(variantSku, tx)) {
        variantSku = `${slugService.slugify(data.variantName)}-${vCount}`;
        vCount++;
      }

      const variant = await productVariantRepository.create({
        productId: product.id,
        name: data.variantName,
        sku: variantSku,
        price: data.price,
        compareAtPrice: data.compareAtPrice
      }, tx);

      // Create Initial Inventory
      await tx.inventory.create({
        data: {
          productVariantId: variant.id,
          availableStock: data.initialStock || 0,
          transactions: {
            create: {
              type: 'STOCK_IN',
              quantity: data.initialStock || 0,
              previousStock: 0,
              newStock: data.initialStock || 0,
              reason: 'Initial stock on product creation',
              createdBy: userId
            }
          }
        }
      });

      return product;
    });
  },

  async getMyProducts(userId, page = 1, limit = 10) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

    return productRepository.findByShopId(shop.id, page, limit);
  },

  async getMyProductById(userId, productId) {
    const seller = await sellerRepository.findByUserId(userId);
    if (!seller) throw new AppError("Seller not found", 404);

    const shop = await shopRepository.findBySellerId(seller.id);
    if (!shop) throw new AppError("Shop not found", 404);

    const product = await productRepository.findById(productId);
    if (!product || product.shopId !== shop.id) throw new AppError("Product not found", 404);

    return product;
  },

  async updateProduct(userId, productId, data, files) {
    const product = await this.getMyProductById(userId, productId);
    
    let updates = { ...data };

    if (files && files.length > 0) {
      if (files.length > 10) throw new AppError("Maximum 10 images allowed", 400);
      
      const uploadTasks = files.map((file) => 
        cloudinaryService.uploadBuffer(file.buffer, 'cravo/products')
      );
      const uploadedImages = await Promise.all(uploadTasks);

      await prisma.$transaction(async (tx) => {
        // Delete old images
        await productImageRepository.deleteByProductId(product.id, tx);
        
        // Add new images
        const imageRecords = uploadedImages.map((img, index) => ({
          productId: product.id,
          imageUrl: img.secure_url,
          publicId: img.public_id,
          sortOrder: index
        }));
        await productImageRepository.createMany(imageRecords, tx);

        // Update product
        await productRepository.update(product.id, updates, tx);
      });
      return productRepository.findById(product.id);
    } else {
      return productRepository.update(product.id, updates);
    }
  },

  async deleteProduct(userId, productId) {
    const product = await this.getMyProductById(userId, productId);
    return productRepository.update(product.id, { status: 'ARCHIVED' });
  },

  async getPendingApplications(status = 'PENDING_APPROVAL') {
    return productRepository.findPendingApplications(status);
  },

  async approveProduct(productId) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.status === 'APPROVED') throw new AppError("Already approved", 400);
    return productRepository.update(productId, { status: 'APPROVED', rejectionReason: null });
  },

  async rejectProduct(productId, reason) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.status === 'REJECTED') throw new AppError("Already rejected", 400);
    return productRepository.update(productId, { status: 'REJECTED', rejectionReason: reason });
  },

  async getPublicProducts(filters, sort, page = 1, limit = 10) {
    return productRepository.searchPublicProducts(filters, sort, page, limit);
  },

  async getPublicProduct(slug) {
    const product = await productRepository.findBySlug(slug);
    if (!product || product.status !== 'APPROVED') throw new AppError("Product not found", 404);
    return product;
  }
};
