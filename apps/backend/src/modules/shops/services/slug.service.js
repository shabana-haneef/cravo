import { shopRepository } from '../repositories/shop.repository.js';

export const slugService = {
  /**
   * Generates a URL-friendly slug from a string
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-');        // Replace multiple - with single -
  },

  /**
   * Generates a unique slug by checking the database
   */
  async generateUniqueSlug(name) {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let count = 2;

    while (await shopRepository.slugExists(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }
};
