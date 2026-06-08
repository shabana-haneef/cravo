import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user.api.js';

// ─── Keys ────────────────────────────────────────────────────────────────────
export const USER_KEYS = {
  profile: ['user-profile'],
  addresses: ['user-addresses'],
  address: (id) => ['user-address', id],
};

// ─── Profile Hooks ────────────────────────────────────────────────────────────
export const useProfile = () => {
  return useQuery({
    queryKey: USER_KEYS.profile,
    queryFn: userApi.getProfile,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.profile });
    },
  });
};

// ─── Address Hooks ────────────────────────────────────────────────────────────
export const useAddresses = () => {
  return useQuery({
    queryKey: USER_KEYS.addresses,
    queryFn: userApi.getAddresses,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.addresses });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => userApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.addresses });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.addresses });
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentData }) => userApi.updateAddress(id, { ...currentData, isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.addresses });
    },
  });
};
