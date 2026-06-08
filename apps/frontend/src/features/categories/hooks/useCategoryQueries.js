import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../api/category.api.js';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes (categories rarely change)
  });
};

export const useCategory = (slug) => {
  return useQuery({
    queryKey: ['categories', slug],
    queryFn: () => categoryApi.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
};
