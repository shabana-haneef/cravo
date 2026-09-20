import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerOrderApi } from '../api/seller-order.api.js';

export const SELLER_ORDERS_KEY = ['seller', 'orders'];

export const useSellerOrders = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...SELLER_ORDERS_KEY, page, limit],
    queryFn: async () => {
      const response = await sellerOrderApi.getSellerOrders(page, limit);
      return response.data || { orders: [], meta: null };
    },
    keepPreviousData: true,
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

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerOrderApi.createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerOrderApi.updateShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
    },
  });
};

export const useCancelShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerOrderApi.cancelShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
    },
  });
};

export const useCancelPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerOrderApi.cancelPickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
    },
  });
};

export const useReschedulePickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerOrderApi.reschedulePickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
    },
  });
};

export const useUpdateEwaybill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerOrderApi.updateEwaybill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
    },
  });
};

