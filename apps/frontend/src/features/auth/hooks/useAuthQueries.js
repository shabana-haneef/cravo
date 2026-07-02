import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api.js';
import { useAuthStore } from '../../../store/auth.store.js';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.accessToken);
    }
  });
};

export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.accessToken);
    }
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: authApi.verifyEmail
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: authApi.resendOtp
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authApi.forgotPassword
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authApi.resetPassword
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      window.location.href = '/login';
    }
  });
};

export const useGetMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
