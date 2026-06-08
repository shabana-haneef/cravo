import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/seller-product.api.js';

export const SELLER_PRODUCTS_KEY = ['seller', 'products'];
export const SELLER_PRODUCT_DETAIL_KEY = (id) => ['seller', 'product', id];

export const useMyProducts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: [...SELLER_PRODUCTS_KEY, page, limit],
    queryFn: async () => {
      const response = await api.getMyProducts(page, limit);
      return response.data;
    },
    keepPreviousData: true,
  });
};

export const useMyProduct = (id) => {
  return useQuery({
    queryKey: SELLER_PRODUCT_DETAIL_KEY(id),
    queryFn: async () => {
      const response = await api.getMyProductById(id);
      return response.data.product;
    },
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_KEY });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCT_DETAIL_KEY(variables.id) });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_KEY });
    },
  });
};

// Variant Hooks
export const useAddVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addVariant,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCT_DETAIL_KEY(variables.productId) });
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateVariant,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCT_DETAIL_KEY(variables.productId) });
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteVariant,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCT_DETAIL_KEY(variables.productId) });
    },
  });
};
