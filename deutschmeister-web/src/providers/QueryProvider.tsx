'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { ApiError } from '@/lib/api/client';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            // Retry once on server/network errors, but never on a 4xx — a 429
            // (rate limited) in particular only gets worse if we immediately
            // re-fire it. Skip all client errors.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}