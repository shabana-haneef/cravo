import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product.api.js';

export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true // Keep showing old data while fetching new page/filters
  });
};

export const useProduct = (slug) => {
  return useQuery({
    queryKey: ['products', slug],
    queryFn: () => productApi.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};
