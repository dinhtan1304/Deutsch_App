'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui';
import { ApiError, clearTokens } from '@/lib/api/client';

/**
 * Global handler for API errors in React Query.
 * 401 errors → redirect to login (backup for client.ts handler).
 */
function handleGlobalError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    clearTokens();
    if (typeof window !== 'undefined') {
      const isAuthPage = window.location.pathname.startsWith('/auth');
      if (!isAuthPage) {
        window.location.href = '/auth/login';
      }
    }
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error) => {
              // Don't retry on 401 (auth errors)
              if (error instanceof ApiError && error.status === 401) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: handleGlobalError,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}