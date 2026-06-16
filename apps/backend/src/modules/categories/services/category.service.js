import { categoryRepository } from '../repositories/category.repository.js';
import { slugService } from '../../shops/services/slug.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';
import prisma from '../../../lib/prisma.js';

const DEFAULT_CATEGORIES = [
  { name: 'Pickles', imageUrl: '/images/categories/images/pickles.png' },
  { name: 'Honey', imageUrl: '/images/categories/images/honey.png' },
  { name: 'Spices & Powders', imageUrl: '/images/categories/images/spices.png' },
  { name: 'Jams & Spreads', imageUrl: '/images/categories/images/jams.png' },
  { name: 'Dry Fruits', imageUrl: '/images/categories/images/dry_fruits.png' },
  { name: 'Chocolates & Candies', imageUrl: '/images/categories/images/chocolates_candies.png' },
  { name: 'Instant Mixes', imageUrl: '/images/categories/images/instant_mixes.png' },
  { name: 'Masala Pastes', imageUrl: '/images/categories/images/masala_pastes.png' },
  { name: 'Ready to Cook', imageUrl: '/images/categories/images/ready_to_cook.png' },
  { name: 'Sauces', imageUrl: '/images/categories/images/sauces.png' },
  { name: 'Snacks', imageUrl: '/images/categories/images/snacks.png' },
  { name: 'Sweet Preserve', imageUrl: '/images/categories/images/sweet_preserve.png' },
  { name: 'Syrups', imageUrl: '/images/categories/images/syrups.png' },
  { name: 'Traditional Preserves', imageUrl: '/images/categories/images/traditional_preserves.png' }
];

export const categoryService = {
  async createCategory(data, file) {
    const slug = slugService.slugify(data.name);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw new AppError("Category already exists", 400);

    let imageUrl = data.imageUrl || null;
    let imagePublicId = null;

    if (file) {
      const uploadResult = await cloudinaryService.uploadBuffer(file.buffer, 'cravo/categories');
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    return categoryRepository.create({ 
      ...data, 
      slug, 
      imageUrl, 
      imagePublicId 
    });
  },
  async getCategories(activeOnly = false) {
    // 1. Seed missing default categories individually
    for (const cat of DEFAULT_CATEGORIES) {
      const slug = slugService.slugify(cat.name);
      const exists = await categoryRepository.findBySlug(slug);
      if (!exists) {
        await categoryRepository.create({
          name: cat.name,
          slug,
          imageUrl: cat.imageUrl,
          isActive: true
        });
      }
    }

    // 2. Clean up empty non-default categories to keep the UI clean
    try {
      const allCats = await categoryRepository.findAll(false);
      for (const cat of allCats) {
        const isDefault = DEFAULT_CATEGORIES.some(dc => slugService.slugify(dc.name) === cat.slug);
        if (!isDefault) {
          const productsCount = await prisma.product.count({ where: { categoryId: cat.id } });
          if (productsCount === 0) {
            await categoryRepository.delete(cat.id);
          }
        }
      }
    } catch (e) {
      // Fail-safe
    }

    return categoryRepository.findAll(activeOnly);
  },
  async getCategoryBySlug(slug) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) throw new AppError("Category not found", 404);
    return category;
  },
  async updateCategory(id, data) {
    let slug;
    if (data.name) {
      slug = slugService.slugify(data.name);
      const existing = await categoryRepository.findBySlug(slug);
      if (existing && existing.id !== id) throw new AppError("Category already exists", 400);
    }
    return categoryRepository.update(id, { ...data, slug });
  },
  async deleteCategory(id) {
    return categoryRepository.delete(id);
  }
};
