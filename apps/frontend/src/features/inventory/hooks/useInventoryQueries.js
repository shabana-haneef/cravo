import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/inventory.api.js';
import { SELLER_PRODUCTS_KEY } from '../../products/hooks/useSellerProductQueries.js';

export const INVENTORY_ITEM_KEY = (variantId) => ['inventory', variantId];
export const INVENTORY_HISTORY_KEY = (variantId, page) => ['inventory', variantId, 'history', page];

export const useInventoryItem = (variantId) => {
  return useQuery({
    queryKey: INVENTORY_ITEM_KEY(variantId),
    queryFn: async () => {
      const response = await api.getInventoryItem(variantId);
      return response.data.inventory;
    },
    enabled: !!variantId,
  });
};

export const useInventoryHistory = (variantId, page = 1, limit = 20) => {
  return useQuery({
    queryKey: INVENTORY_HISTORY_KEY(variantId, page),
    queryFn: async () => {
      const response = await api.getInventoryHistory({ variantId, page, limit });
      return response.data.history;
    },
    enabled: !!variantId,
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.adjustStock,
    onSuccess: (_, variables) => {
      // Invalidate the specific inventory item
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_KEY(variables.variantId) });
      // Invalidate its history
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.variantId, 'history'] });
      // Invalidate the products list because stock data might be nested inside products list
      queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_KEY });
    },
  });
};
