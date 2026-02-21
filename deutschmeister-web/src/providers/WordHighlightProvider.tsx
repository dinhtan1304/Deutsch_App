'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useWordHighlightStore } from '@/stores/wordHighlightStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Provider fetch vocabulary level index khi app khởi động.
 * Thêm vào providers.tsx, bên trong QueryClientProvider.
 *
 * Data chỉ fetch 1 lần → cache trong Zustand store.
 * Retry tự động sau khi user login nếu fetch trước đó bị lỗi
 * (VD: endpoint cần auth, user chưa đăng nhập lúc app load).
 */
export function WordHighlightProvider({ children }: { children: ReactNode }) {
  const { fetchLevelIndex, hasFetched, isLoading, levelIndex, reset } = useWordHighlightStore();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const prevAuthRef = useRef(false);

  // Fetch lần đầu khi mount
  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchLevelIndex();
    }
  }, [hasFetched, isLoading, fetchLevelIndex]);

  // Retry sau khi login nếu fetch trước đó fail (hasFetched=true nhưng levelIndex=null)
  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current && hasFetched && !levelIndex) {
      reset(); // đặt hasFetched=false → effect trên sẽ gọi fetchLevelIndex()
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, hasFetched, levelIndex, reset]);

  return <>{children}</>;
}
