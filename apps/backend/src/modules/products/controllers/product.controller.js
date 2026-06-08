import { productService } from '../services/product.service.js';
import { productSchema, updateProductSchema } from '../validators/product.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';

export const productController = {
  async createProduct(req, res, next) {
    try {
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const product = await productService.createProduct(req.user.id, parsed.data, req.files?.images);
      logger.info({ userId: req.user.id, productId: product.id }, 'Product created');
      return successResponse(res, 'Product created successfully', { product }, 201);
    } catch (error) { next(error); }
  },

  async getMyProducts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await productService.getMyProducts(req.user.id, page, limit);
      return successResponse(res, 'Products retrieved', { products: result.data, meta: result.meta });
    } catch (error) { next(error); }
  },

  async getMyProductById(req, res, next) {
    try {
      const product = await productService.getMyProductById(req.user.id, req.params.id);
      return successResponse(res, 'Product retrieved', { product });
    } catch (error) { next(error); }
  },

  async updateProduct(req, res, next) {
    try {
      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const product = await productService.updateProduct(req.user.id, req.params.id, parsed.data, req.files?.images);
      logger.info({ userId: req.user.id, productId: product.id }, 'Product updated');
      return successResponse(res, 'Product updated successfully', { product });
    } catch (error) { next(error); }
  },

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.user.id, req.params.id);
      logger.info({ userId: req.user.id, productId: req.params.id }, 'Product soft deleted');
      return successResponse(res, 'Product deleted successfully');
    } catch (error) { next(error); }
  },

  async getPublicProducts(req, res, next) {
    try {
      const { category, shop, minPrice, maxPrice, sort } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = { category, shop, minPrice, maxPrice };
      const result = await productService.getPublicProducts(filters, sort, page, limit);
      return successResponse(res, 'Products retrieved', { products: result.data, meta: result.meta });
    } catch (error) { next(error); }
  },

  async getPublicProduct(req, res, next) {
    try {
      const product = await productService.getPublicProduct(req.params.slug);
      return successResponse(res, 'Product retrieved', { product });
    } catch (error) { next(error); }
  }
};
