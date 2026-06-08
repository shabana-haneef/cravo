import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart.api.js';
import { useCartStore } from '../../../store/cart.store.js';

export const CART_KEYS = {
  all: ['cart'],
};

export const useCart = () => {
  const setItemCount = useCartStore(state => state.setItemCount);

  return useQuery({
    queryKey: CART_KEYS.all,
    queryFn: async () => {
      const data = await cartApi.getCart();
      // Sync store count when fetching cart
      const count = data?.data?.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
      setItemCount(count);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore(state => state.setItemCount);

  return useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      // Optimistically update count
      const count = res?.data?.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
      setItemCount(count);
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }) => cartApi.updateItemQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore(state => state.setItemCount);

  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      setItemCount(0);
    },
  });
};
