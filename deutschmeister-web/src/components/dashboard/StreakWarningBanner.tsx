'use client';

import Link from 'next/link';
import { useStreakStatus } from '@/hooks/useDailyBonus';

/**
 * Shows a warning banner when the user has an active streak (≥3) but
 * hasn't done any activity today yet. Encourages them to study before
 * midnight VN time to keep the streak alive.
 */
export function StreakWarningBanner() {
  const { data, isLoading } = useStreakStatus();

  if (isLoading || !data) return null;
  if (data.activeToday) return null;
  if (data.streak < 3) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3"
      style={{
        background:
          'linear-gradient(135deg, rgba(239,68,68,.12), rgba(249,115,22,.10))',
        border: '1px solid rgba(239,68,68,.25)',
      }}
    >
      <div className="text-3xl animate-pulse">⚠️</div>
      <div className="flex-1 min-w-0">
        <div
          className="font-bold text-sm"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          Streak {data.streak} ngày của bạn đang gặp nguy hiểm!
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          Hãy học ít nhất 1 bài hôm nay để giữ streak. Hết ngày (VN) là
          mất đấy
        </div>
      </div>
      <Link
        href="/games/quick-quiz"
        className="shrink-0 px-4 py-2 rounded-xl font-semibold text-body text-white shadow-lg transition-transform hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #EF4444, #F97316)',
        }}
      >
        Học ngay
      </Link>
    </div>
  );
}
