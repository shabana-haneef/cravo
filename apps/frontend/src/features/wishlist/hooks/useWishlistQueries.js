import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../api/wishlist.api.js';

export const WISHLIST_KEYS = {
  all: ['wishlist'],
  status: (productId) => ['wishlist', 'status', productId],
};

export const useWishlist = (enabled = true) => {
  return useQuery({
    queryKey: WISHLIST_KEYS.all,
    queryFn: async () => {
      const res = await wishlistApi.getWishlist();
      return res?.data?.wishlist || [];
    },
    staleTime: 1000 * 60 * 5, // 5 mins
    enabled,
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wishlistApi.toggleWishlist,
    onSuccess: (res, productId) => {
      // Invalidate both lists and status queries
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.status(productId) });
    },
  });
};

export const useWishlistStatus = (productId, enabled = true) => {
  return useQuery({
    queryKey: WISHLIST_KEYS.status(productId),
    queryFn: async () => {
      const res = await wishlistApi.checkStatus(productId);
      return res?.data?.wishlisted || false;
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};
