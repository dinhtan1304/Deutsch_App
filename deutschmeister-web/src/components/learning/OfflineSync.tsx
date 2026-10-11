'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { bindOfflineOwner } from '@/lib/offline/repository';
import { syncOfflineReviews } from '@/lib/offline/sync';

export function OfflineSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const sync = async () => {
      try {
        await bindOfflineOwner(userId);
        if (cancelled || useAuthStore.getState().user?.id !== userId) return;
        await syncOfflineReviews(userId);
        if (!cancelled) {
          void queryClient.invalidateQueries({ queryKey: ['progress'] });
          void queryClient.invalidateQueries({ queryKey: ['xp'] });
          void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      } catch {
        /* IndexedDB may be disabled; online learning stays available. */
      }
    };
    void sync();
    window.addEventListener('online', sync);
    return () => {
      cancelled = true;
      window.removeEventListener('online', sync);
    };
  }, [userId, queryClient]);
  return null;
}
