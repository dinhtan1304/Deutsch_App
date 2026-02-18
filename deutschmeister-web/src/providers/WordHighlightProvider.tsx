'use client';

import { useEffect, ReactNode } from 'react';
import { useWordHighlightStore } from '@/stores/wordHighlightStore';

/**
 * Provider fetch vocabulary level index khi app khởi động.
 * Thêm vào providers.tsx, bên trong QueryClientProvider.
 *
 * Data chỉ fetch 1 lần → cache trong Zustand store.
 */
export function WordHighlightProvider({ children }: { children: ReactNode }) {
  const { fetchLevelIndex, hasFetched, isLoading } = useWordHighlightStore();

  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchLevelIndex();
    }
  }, [hasFetched, isLoading, fetchLevelIndex]);

  return <>{children}</>;
}
