import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/order.api.js';
import { paymentApi } from '../api/payment.api.js';

export const ORDER_KEYS = {
  preview: ['checkout-preview'],
  myOrders: ['my-orders'],
  order: (id) => ['order', id],
};

export const useCheckoutPreview = (params) => {
  return useQuery({
    queryKey: [...ORDER_KEYS.preview, params],
    queryFn: () => orderApi.getPreview(params),
    retry: false, // Don't retry on empty cart
  });
};

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: orderApi.createCheckoutOrder,
  });
};

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: paymentApi.verifyPayment,
  });
};

export const useMyOrders = () => {
  return useQuery({
    queryKey: ORDER_KEYS.myOrders,
    queryFn: orderApi.getMyOrders,
  });
};

export const useOrderById = (id) => {
  return useQuery({
    queryKey: ORDER_KEYS.order(id),
    queryFn: () => orderApi.getOrderById(id),
    enabled: !!id,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orderApi.cancelOrder,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.myOrders });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.order(variables) });
    },
  });
};
