import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
      },

      updateUser: (user) => {
        set({ user });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
