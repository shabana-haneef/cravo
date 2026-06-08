import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerOrderApi } from '../api/seller-order.api.js';

export const SELLER_ORDERS_KEY = ['seller', 'orders'];

export const useSellerOrders = () => {
  return useQuery({
    queryKey: SELLER_ORDERS_KEY,
    queryFn: async () => {
      const response = await sellerOrderApi.getSellerOrders();
      return response.data?.orders || [];
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerOrderApi.updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
    },
  });
};
