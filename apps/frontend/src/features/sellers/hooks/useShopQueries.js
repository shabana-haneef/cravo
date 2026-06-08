import { useQuery } from '@tanstack/react-query';
import { shopApi } from '../api/shop.api.js';

export const MY_SHOP_KEY = ['seller', 'shop'];

export const useMyShop = () => {
  return useQuery({
    queryKey: MY_SHOP_KEY,
    queryFn: async () => {
      const response = await shopApi.getMyShop();
      return response.data?.shop || null;
    },
  });
};
