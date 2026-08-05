import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRouter } from './routes/AppRouter.jsx';
import { useAuthStore } from './store/auth.store.js';
import { api } from './lib/axios.js';
import { LoadingScreen } from './components/ui/LoadingScreen.jsx';
import { getSocket, disconnectSocket } from './lib/socket.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) return false;
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const currentToken = useAuthStore.getState().accessToken;
        setAuth(data.data.user, currentToken);
      } catch (error) {
        // Only log out on explicit 401 Unauthorized or 403 Forbidden.
        // Ignore 5xx errors or Network Errors to prevent unexpected logouts during server restarts.
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          clearAuth();
        }
      } finally {
        setInitializing(false);
      }
    };

    initAuth();
  }, [setAuth, clearAuth, setInitializing]);

  // Manage socket lifecycle based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      getSocket(); // Lazily connect
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);


  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;

