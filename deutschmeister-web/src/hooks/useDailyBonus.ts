'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type DailyBonusResult, type StreakStatus } from '@/lib/api/users';
import { dashboardKeys } from './useDashboard';

const LAST_CLAIM_KEY = 'dm_last_daily_bonus_vn_date';

/**
 * Returns today's date in VN timezone as YYYY-MM-DD.
 * Used as a local idempotency guard so we don't spam the claim endpoint
 * on every dashboard mount within the same day.
 */
function getVnDateStr(): string {
  const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
  const vn = new Date(Date.now() + TZ_OFFSET_MS);
  return vn.toISOString().slice(0, 10);
}

export function useStreakStatus() {
  return useQuery<StreakStatus>({
    queryKey: ['streak', 'status'],
    queryFn: () => usersApi.getStreakStatus(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Auto-claim daily bonus on mount, guarded by localStorage so the POST only
 * fires once per VN day per browser. Returns the bonus payload (if any) so
 * UI can show a toast.
 */
export function useAutoDailyBonus(enabled: boolean) {
  const qc = useQueryClient();
  const [bonus, setBonus] = useState<DailyBonusResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => usersApi.claimDailyBonus(),
    onSuccess: (data) => {
      if (data.claimed) {
        setBonus(data);
        // Invalidate dashboard stats + xp so streak/xp refresh
        qc.invalidateQueries({ queryKey: dashboardKeys.all });
        qc.invalidateQueries({ queryKey: ['streak', 'status'] });
      }
      // Always mark today as attempted to prevent retry loops
      try {
        localStorage.setItem(LAST_CLAIM_KEY, getVnDateStr());
      } catch {
        // localStorage may be unavailable (SSR, private mode) — ignore
      }
    },
  });

  useEffect(() => {
    if (!enabled) return;
    let lastClaimed: string | null = null;
    try {
      lastClaimed = localStorage.getItem(LAST_CLAIM_KEY);
    } catch {
      lastClaimed = null;
    }
    if (lastClaimed === getVnDateStr()) return;
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const dismiss = () => setBonus(null);

  return { bonus, dismiss };
}
