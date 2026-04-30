'use client';
/* eslint-disable no-restricted-syntax -- custom UI gradients */

import Link from 'next/link';
import { useFullDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

interface JourneyStep {
  title: string;
  href: string;
  color: string;
  checkFn: (stats: { totalWordsLearned: number; gamesPlayed: number; grammarCompleted: number }) => boolean;
}

const STEPS: JourneyStep[] = [
  {
    title: 'Khám phá chủ đề & học 5 từ',
    href: '/topics',
    color: ACCENT.srs,
    checkFn: (s) => s.totalWordsLearned >= 5,
  },
  {
    title: 'Chơi 1 trò chơi để ôn tập',
    href: '/games',
    color: ACCENT.vocab,
    checkFn: (s) => s.gamesPlayed >= 1,
  },
  {
    title: 'Học 1 bài ngữ pháp',
    href: '/grammar',
    color: ACCENT.xp,
    checkFn: (s) => s.grammarCompleted >= 1,
  },
];

export function FirstDayJourney() {
  const { user } = useAuthStore();
  const { data } = useFullDashboard();
  const stats = data?.stats;

  if (!stats) return null;

  const completedCount = STEPS.filter((s) => s.checkFn(stats)).length;

  if (completedCount >= STEPS.length) return null;

  const nextStep = STEPS.find((s) => !s.checkFn(stats));
  const progressPct = (completedCount / STEPS.length) * 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const level = (user as any)?.preferredLevel as string || 'A1';

  return (
    <Link
      href={nextStep?.href || '/topics'}
      className="flex flex-col gap-2 p-3 rounded-xl border transition-all group hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        borderColor: 'rgba(99,102,241,0.15)',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))',
      }}
    >
      {/* Decorative background dots */}
      <svg className="absolute right-2 top-1 opacity-[0.07] pointer-events-none" width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="8" cy="8" r="4" fill="#6366F1" />
        <circle cx="28" cy="8" r="3" fill="#3B82F6" />
        <circle cx="48" cy="8" r="4" fill="#8B5CF6" />
        <circle cx="8" cy="28" r="3" fill="#8B5CF6" />
        <circle cx="28" cy="28" r="5" fill="#6366F1" />
        <circle cx="48" cy="28" r="3" fill="#3B82F6" />
        <circle cx="8" cy="48" r="4" fill="#3B82F6" />
        <circle cx="28" cy="48" r="3" fill="#8B5CF6" />
        <circle cx="48" cy="48" r="4" fill="#6366F1" />
      </svg>
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
        >
          {/* Rocket icon */}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            Hành trình ngày đầu tiên
          </div>
          <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
            Hoàn thành 3 bước để bắt đầu {level}
          </div>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
          style={{
            background: completedCount > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
            color: completedCount > 0 ? STATUS.success : ACCENT.srs,
          }}
        >
          {completedCount}/{STEPS.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
          }}
        />
      </div>
    </Link>
  );
}
