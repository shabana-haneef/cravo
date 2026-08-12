import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const authChannel = new BroadcastChannel('auth_sync');

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

      clearAuth: (broadcast = true) => {
        set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
        if (broadcast) {
          authChannel.postMessage('LOGOUT');
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
        // accessToken intentionally omitted (stored only in memory)
      }),
    }
  )
);

// Listen for cross-tab logout events
authChannel.onmessage = (event) => {
  if (event.data === 'LOGOUT') {
    useAuthStore.getState().clearAuth(false); // Clear locally without re-broadcasting
  }
};
