import { productVariantRepository } from '../repositories/productVariant.repository.js';
import { productService } from './product.service.js';
import { slugService } from '../../shops/services/slug.service.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const productVariantService = {
  async addVariant(userId, productId, data) {
    // Ensures IDOR protection - caller must own the product
    const product = await productService.getMyProductById(userId, productId);

    let variantSku = data.sku || slugService.slugify(data.name);
    let vCount = 2;
    while(await productVariantRepository.skuExists(variantSku)) {
      variantSku = `${slugService.slugify(data.name)}-${vCount}`;
      vCount++;
    }

    return productVariantRepository.create({
      ...data,
      productId: product.id,
      sku: variantSku
    });
  },

  async updateVariant(userId, productId, variantId, data) {
    await productService.getMyProductById(userId, productId); // Auth
    
    const variant = await productVariantRepository.findById(variantId);
    if (!variant || variant.productId !== productId) throw new AppError("Variant not found", 404);

    return productVariantRepository.update(variantId, data);
  },

  async deleteVariant(userId, productId, variantId) {
    await productService.getMyProductById(userId, productId); // Auth

    const variant = await productVariantRepository.findById(variantId);
    if (!variant || variant.productId !== productId) throw new AppError("Variant not found", 404);

    return productVariantRepository.delete(variantId);
  }
};
