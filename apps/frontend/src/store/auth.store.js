import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      isInitializing: true,

      setInitializing: (isInitializing) => set({ isInitializing }),

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true, isInitializing: false });
      },

      updateUser: (user) => {
        set({ user });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken
      }),
    }
  )
);
