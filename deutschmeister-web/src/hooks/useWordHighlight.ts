import { useEffect } from 'react';
import { useWordHighlightStore } from '@/stores/wordHighlightStore';

/**
 * Hook khởi tạo Word Highlighting.
 * Gọi 1 lần ở Provider/Layout → fetch level index.
 * Trả về { enabled, toggle, getLevel } để component con sử dụng.
 */
export function useWordHighlight() {
  const {
    enabled,
    toggle,
    getLevel,
    fetchLevelIndex,
    isLoading,
    hasFetched,
  } = useWordHighlightStore();

  // Auto-fetch level index khi mount (nếu chưa có)
  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchLevelIndex();
    }
  }, [hasFetched, isLoading, fetchLevelIndex]);

  return { enabled, toggle, getLevel, isLoading, hasFetched };
}
