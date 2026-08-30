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
          return newToken;
        } catch (error) {
          // If definitive auth failure (401 or 403), logout
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            broadcast('AUTH_REFRESH_FAILED');
            get().clearAuth(false);
          } else {
            // Transient network failure: reset restoring flag without clearing session
            set({ _isRestoring: false, authStatus: 'idle', isInitializing: false });
          }
          throw error;
        } finally {
          set({ _isRestoring: false });
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
  // Handshake: ask if anyone is currently authenticated
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

    // Ignore stale messages
    if (data.timestamp && Date.now() - data.timestamp > 30000) return;

    switch (data.type) {
      case 'AUTH_LOGOUT':
        store.clearAuth(false);
        break;

      case 'AUTH_REFRESH_COMPLETED':
        if (data.token) {
          store.setAuth(data.user || store.user, data.token, false);
        }
        break;

      case 'AUTH_REFRESH_FAILED':
        if (store.isAuthenticated) {
          store.clearAuth(false);
        }
        break;

      case 'AUTH_STATE_REQUEST':
        if (store.authStatus === 'authenticated' && store.accessToken) {
          broadcast('AUTH_REFRESH_COMPLETED', { token: store.accessToken, user: store.user });
        }
        break;
    }
  };
}

