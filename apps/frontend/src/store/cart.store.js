import { create } from 'zustand';
import { cartApi } from '../features/cart/api/cart.api.js';

export const useCartStore = create((set, get) => ({
  itemCount: 0,
  
  // To optimistically update count without waiting for full query refetch
  setItemCount: (count) => set({ itemCount: count }),
  
  // Optional: A helper to fetch cart and update count directly
  syncCartCount: async () => {
    try {
      const { data } = await cartApi.getCart();
      const count = data?.cart?.items?.length || 0;
      set({ itemCount: count });
    } catch (error) {
      console.error('Failed to sync cart count:', error);
    }
  },

  clearCartCount: () => set({ itemCount: 0 })
}));
