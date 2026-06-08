import { useQuery, useMutation } from '@tanstack/react-query';
import { orderApi } from '../api/order.api.js';
import { paymentApi } from '../api/payment.api.js';

export const ORDER_KEYS = {
  preview: ['checkout-preview'],
  myOrders: ['my-orders'],
  order: (id) => ['order', id],
};

export const useCheckoutPreview = () => {
  return useQuery({
    queryKey: ORDER_KEYS.preview,
    queryFn: orderApi.getPreview,
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
