import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSellerApplication, applyAsSeller } from '../api/seller.api.js';

export const SELLER_APPLICATION_KEY = ['seller', 'application'];

/**
 * Fetches the current seller application status.
 * Returns null data gracefully if the user has no application (404).
 */
export const useSellerApplication = () => {
  return useQuery({
    queryKey: SELLER_APPLICATION_KEY,
    queryFn: async () => {
      try {
        return await getSellerApplication();
      } catch (error) {
        // 404 means no application exists yet — treat as null
        if (error.response?.status === 404) return { data: { application: null } };
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30s - application status can change
  });
};

/**
 * Mutation hook to submit a seller application.
 * On success, invalidates the application query to refetch the new status.
 */
export const useApplySeller = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyAsSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_APPLICATION_KEY });
    },
  });
};
