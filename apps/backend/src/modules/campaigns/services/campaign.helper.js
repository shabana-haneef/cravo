import prisma from '../../../lib/prisma.js';

export const campaignHelper = {
  /**
   * Returns a map of productId -> discountPercentage based on active campaigns.
   */
  async getDiscountsForProducts(shopId, productIds) {
    if (!shopId || !productIds || productIds.length === 0) return new Map();

    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        shopId: shopId,
        OR: [
          { type: 'DISCOUNT_CAMPAIGN' },
          { type: 'FLASH_SALE', targetProductIds: { hasSome: productIds } }
        ]
      }
    });

    const discountMap = new Map();

    let storewideDiscount = 0;
    const productDiscounts = {};

    activeCampaigns.forEach(c => {
      if (c.type === 'DISCOUNT_CAMPAIGN' && c.metadata?.discount) {
        storewideDiscount = Math.max(storewideDiscount, c.metadata.discount);
      }
      if (c.type === 'FLASH_SALE') { // Assuming Flash Sale also behaves as a type of discount or uses metadata? 
        // Oh wait, in my plan Flash Sale fee is 100, but I didn't specify the discount. 
        // Usually flash sale has a massive discount. Wait, the user prompt didn't specify discount for flash sale, it just said 'Fee: 100, 24 hours'.
        // If they want to specify a discount, it should be in metadata. I will assume Flash Sale has a metadata.discount if they provided one, else 0.
        const saleDiscount = c.metadata?.discount || 0;
        c.targetProductIds.forEach(pid => {
           productDiscounts[pid] = Math.max(productDiscounts[pid] || 0, saleDiscount);
        });
      }
    });

    productIds.forEach(pid => {
      const maxDiscount = Math.max(storewideDiscount, productDiscounts[pid] || 0);
      if (maxDiscount > 0) {
        discountMap.set(pid, maxDiscount);
      }
    });

    return discountMap;
  },

  /**
   * Applies campaign discounts to an array of cart/checkout items.
   * Expects item to have { product: { id, shopId }, productVariant: { price, compareAtPrice } }
   * Modifies item.productVariant in place.
   */
  async applyDiscountsToCartItems(shopId, items) {
    const productIds = [...new Set(items.map(i => i.productId || i.product?.id).filter(Boolean))];
    const discountMap = await this.getDiscountsForProducts(shopId, productIds);

    items.forEach(item => {
      const pid = item.productId || item.product?.id;
      const discount = discountMap.get(pid);
      if (discount && item.productVariant) {
        const variant = item.productVariant;
        const basePrice = Number(variant.price);
        const discountedPrice = Number((basePrice * (1 - discount / 100)).toFixed(2));
        variant.originalPrice = variant.compareAtPrice || basePrice;
        variant.compareAtPrice = variant.compareAtPrice || basePrice;
        variant.price = Math.min(basePrice, discountedPrice);
        variant.isCampaignDiscount = true;
        variant.campaignDiscountPercentage = discount;
      }
    });

    return items;
  }
};
