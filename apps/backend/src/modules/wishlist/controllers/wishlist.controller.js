import { wishlistService } from '../services/wishlist.service.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';

export const wishlistController = {
  async toggleWishlist(req, res, next) {
    try {
      const { productId } = req.body;
      if (!productId) {
        return errorResponse(res, 'Product ID is required', 400);
      }

      const result = await wishlistService.toggleWishlist(req.user.id, productId);
      return successResponse(
        res,
        result.wishlisted ? 'Product added to wishlist' : 'Product removed from wishlist',
        result
      );
    } catch (error) {
      next(error);
    }
  },

  async getWishlist(req, res, next) {
    try {
      const wishlist = await wishlistService.getWishlist(req.user.id);
      return successResponse(res, 'Wishlist retrieved successfully', { wishlist });
    } catch (error) {
      next(error);
    }
  },

  async checkWishlistStatus(req, res, next) {
    try {
      const { productId } = req.params;
      if (!productId) {
        return errorResponse(res, 'Product ID is required', 400);
      }

      const result = await wishlistService.checkWishlistStatus(req.user.id, productId);
      return successResponse(res, 'Wishlist status checked', result);
    } catch (error) {
      next(error);
    }
  }
};
