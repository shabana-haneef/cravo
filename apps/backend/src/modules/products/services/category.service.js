import { categoryRepository } from '../repositories/category.repository.js';
import { slugService } from '../../shops/services/slug.service.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const categoryService = {
  async createCategory(data) {
    const slug = slugService.slugify(data.name);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw new AppError("Category already exists", 400);

    return categoryRepository.create({ ...data, slug });
  },
  async getCategories(activeOnly = false) {
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
