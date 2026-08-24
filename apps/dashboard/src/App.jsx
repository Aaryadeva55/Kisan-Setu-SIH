import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes';
import { useAuthStore } from './store/authStore';
import { SEED_USERS } from './mocks/seedData';

export function App() {
  const { setSession, setLoading } = useAuthStore();

  // Rehydrate initial session on app boot
  useEffect(() => {
    // For seamless local dev and SIH demo experience, hydrate default Buyer user if no token in memory
    const defaultUser = SEED_USERS.buyer;
    setSession(defaultUser, `mock_jwt_token_buyer_${Date.now()}`);
    setLoading(false);
  }, [setSession, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'font-sans text-xs font-medium',
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
