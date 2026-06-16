import { categoryService } from '../services/category.service.js';
import { categorySchema } from '../validators/category.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const categoryController = {
  async createCategory(req, res, next) {
    try {
      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const category = await categoryService.createCategory(parsed.data, req.file);
      return successResponse(res, 'Category created successfully', { category }, 201);
    } catch (error) { next(error); }
  },
  async getCategories(req, res, next) {
    try {
      const activeOnly = !req.user || req.user.role !== 'ADMIN'; // Public sees only active
      const categories = await categoryService.getCategories(activeOnly);
      return successResponse(res, 'Categories retrieved', { categories });
    } catch (error) { next(error); }
  },
  async getCategoryBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      return successResponse(res, 'Category retrieved', { category });
    } catch (error) { next(error); }
  },
  async updateCategory(req, res, next) {
    try {
      const parsed = categorySchema.partial().safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);
      const category = await categoryService.updateCategory(req.params.id, parsed.data);
      return successResponse(res, 'Category updated', { category });
    } catch (error) { next(error); }
  },
  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return successResponse(res, 'Category deleted');
    } catch (error) { next(error); }
  }
};
