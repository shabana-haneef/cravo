// Flat or distance-based delivery charge calculation
export const deliveryChargeService = {
  calculateCharge(cart, userAddress, shopAddress) {
    // For now, implementing a flat rate.
    // In a full implementation, you would calculate Haversine distance
    // between userAddress.lat/lng and shopAddress.lat/lng
    const FLAT_RATE = 50;
    
    // Example: if order > 1000, free delivery
    if (cart.summary.subtotal >= 1000) {
      return 0;
    }

    return FLAT_RATE;
  }
};
