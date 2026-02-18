'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui';
import { ApiError, clearTokens } from '@/lib/api/client';
import { DictionaryProvider } from '@/providers/DictionaryProvider';
import { WordHighlightProvider } from '@/providers/WordHighlightProvider';
import { GrammarAnalyzerProvider } from '@/providers/GrammarAnalyzerProvider';

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
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
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
        <WordHighlightProvider>
          <DictionaryProvider>
            <GrammarAnalyzerProvider>
              {children}
            </GrammarAnalyzerProvider>
          </DictionaryProvider>
        </WordHighlightProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
