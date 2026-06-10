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
  const [isInitializing, setIsInitializing] = useState(true);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setAuth(data.data.user, null);
      } catch (error) {
        clearAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [setAuth, clearAuth]);

  // Manage socket lifecycle based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      getSocket(); // Lazily connect
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  if (isInitializing) {
    return <LoadingScreen message="Starting up Cravo..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;

