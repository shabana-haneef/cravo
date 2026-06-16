import { wishlistRepository } from '../repositories/wishlist.repository.js';
import { productRepository } from '../../products/repositories/product.repository.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const wishlistService = {
  async toggleWishlist(userId, productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const isWishlisted = await wishlistRepository.checkExists(userId, productId);

    if (isWishlisted) {
      await wishlistRepository.remove(userId, productId);
      return { wishlisted: false };
    } else {
      await wishlistRepository.add(userId, productId);
      return { wishlisted: true };
    }
  },

  async getWishlist(userId) {
    return wishlistRepository.findAllByUser(userId);
  },

  async checkWishlistStatus(userId, productId) {
    const wishlisted = await wishlistRepository.checkExists(userId, productId);
    return { wishlisted };
  }
};
