'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { createAppQueryClient } from '@/lib/queryClient';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    createAppQueryClient
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
