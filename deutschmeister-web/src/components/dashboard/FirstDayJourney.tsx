'use client';

import Link from 'next/link';
import { useFullDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';

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
    color: '#3B82F6',
    checkFn: (s) => s.totalWordsLearned >= 5,
  },
  {
    title: 'Chơi 1 trò chơi để ôn tập',
    href: '/games',
    color: '#8B5CF6',
    checkFn: (s) => s.gamesPlayed >= 1,
  },
  {
    title: 'Học 1 bài ngữ pháp',
    href: '/grammar',
    color: '#F59E0B',
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
      className="flex flex-col gap-2 p-3 rounded-xl border transition-all group hover:-translate-y-0.5"
      style={{
        borderColor: 'rgba(99,102,241,0.15)',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            Hành trình ngày đầu tiên
          </div>
          <div className="text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>
            Hoàn thành 3 bước để bắt đầu {level}
          </div>
        </div>
        <span
          className="text-[12px] font-bold px-2 py-0.5 rounded-md shrink-0"
          style={{
            background: completedCount > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
            color: completedCount > 0 ? '#22C55E' : '#3B82F6',
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
