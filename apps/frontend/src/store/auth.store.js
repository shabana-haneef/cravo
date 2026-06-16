import { create } from 'zustand';

export const useAuthStore = create((set) => ({
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
}));
