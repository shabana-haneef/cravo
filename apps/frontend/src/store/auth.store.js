import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TAB_ID = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth_sync') : null;

let watchdogTimer = null;

const broadcast = (type, payload = {}) => {
  if (authChannel) {
    authChannel.postMessage({
      type,
      tabId: TAB_ID,
      timestamp: Date.now(),
      ...payload
    });
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      
      authStatus: 'idle',
      isInitializing: true,
      
      _isRestoring: false,
      _foreignRefreshOwner: null, // Tracks which tab currently owns the refresh

      setInitializing: (isInitializing) => set({ isInitializing }),

      setAuth: (user, accessToken, shouldBroadcast = true) => {
        set({ 
          user, 
          accessToken, 
          isAuthenticated: true, 
          authStatus: 'authenticated',
          isInitializing: false,
          _isRestoring: false,
          _foreignRefreshOwner: null
        });
        
        if (shouldBroadcast) {
          broadcast('AUTH_REFRESH_COMPLETED', { token: accessToken, user });
        }
      },

      updateUser: (user) => {
        set({ user });
      },

      clearAuth: (shouldBroadcast = true) => {
        set({ 
          user: null, 
          accessToken: null, 
          isAuthenticated: false, 
          authStatus: 'unauthenticated',
          isInitializing: false,
          _isRestoring: false,
          _foreignRefreshOwner: null
        });
        
        if (shouldBroadcast) {
          broadcast('AUTH_LOGOUT');
        }
      },
      
      // Called when a foreign tab is taking too long to refresh
      _watchdogTimeout: () => {
        const state = get();
        if (state.authStatus === 'restoring') {
          // The owner tab died or hung. We clear the lock so this tab can take over if it needs to.
          set({ authStatus: 'idle', _isRestoring: false, _foreignRefreshOwner: null });
        }
      },

      restoreAuth: async (apiClient, forceRefresh = false) => {
        const state = get();
        
        if (!state.isAuthenticated) {
          set({ authStatus: 'unauthenticated', isInitializing: false });
          return;
        }

        if (state.accessToken && !forceRefresh) {
          set({ authStatus: 'authenticated', isInitializing: false });
          return;
        }

        if (state._isRestoring) {
          return; 
        }

        set({ _isRestoring: true, authStatus: 'restoring', _foreignRefreshOwner: TAB_ID });
        broadcast('AUTH_REFRESH_STARTED');

        try {
          const { data } = await apiClient.post('/auth/refresh-token');
          const newToken = data.data.accessToken;
          
          get().setAuth(state.user, newToken, true);
        } catch (error) {
          if (error.response?.status === 401 && error.response?.data?.message === 'Concurrent refresh detected') {
             // Let the watchdog or actual cross-tab event resolve this
             set({ _isRestoring: false, authStatus: 'restoring' });
             return;
          }
          
          broadcast('AUTH_REFRESH_FAILED');
          get().clearAuth(false);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

if (authChannel) {
  // Handshake: ask if anyone is currently refreshing
  broadcast('AUTH_STATE_REQUEST');

  authChannel.onmessage = (event) => {
    const data = event.data;
    const store = useAuthStore.getState();
    
    // Ignore legacy messages
    if (typeof data === 'string') {
      if (data === 'LOGOUT') store.clearAuth(false);
      return;
    }

    // Ignore our own messages
    if (data.tabId === TAB_ID) return;

    // Ignore extremely stale messages (e.g. > 1 minute old)
    if (data.timestamp && Date.now() - data.timestamp > 60000) return;

    switch (data.type) {
      case 'AUTH_LOGOUT':
        store.clearAuth(false);
        break;

      case 'AUTH_REFRESH_COMPLETED':
        if (watchdogTimer) clearTimeout(watchdogTimer);
        if (data.token) {
          store.setAuth(data.user || store.user, data.token, false);
        }
        break;

      case 'AUTH_REFRESH_STARTED':
        // Another tab is refreshing. We wait.
        if (watchdogTimer) clearTimeout(watchdogTimer);
        useAuthStore.setState({ authStatus: 'restoring', _isRestoring: true, _foreignRefreshOwner: data.tabId });
        
        // 10 second watchdog
        watchdogTimer = setTimeout(() => {
          useAuthStore.getState()._watchdogTimeout();
        }, 10000);
        break;

      case 'AUTH_REFRESH_FAILED':
        if (watchdogTimer) clearTimeout(watchdogTimer);
        // If the owner tab failed, we clear auth too
        if (store._foreignRefreshOwner === data.tabId || !store._foreignRefreshOwner) {
          store.clearAuth(false);
        }
        break;

      case 'AUTH_STATE_REQUEST':
        // A new tab opened. If WE are currently refreshing, tell them!
        if (store._isRestoring && store._foreignRefreshOwner === TAB_ID) {
          broadcast('AUTH_REFRESH_STARTED');
        } else if (store.authStatus === 'authenticated' && store.accessToken) {
          // Or if we are already fully authenticated, sync the token so they don't have to hit the network
          broadcast('AUTH_REFRESH_COMPLETED', { token: store.accessToken, user: store.user });
        }
        break;
    }
  };
}
