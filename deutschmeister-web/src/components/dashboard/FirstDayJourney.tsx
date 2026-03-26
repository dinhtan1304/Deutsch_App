'use client';

import Link from 'next/link';
import { useFullDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';

interface JourneyStep {
  title: string;
  description: string;
  href: string;
  iconPath: string;
  color: string;
  checkFn: (stats: { totalWordsLearned: number; gamesPlayed: number; grammarCompleted: number }) => boolean;
}

const STEPS: JourneyStep[] = [
  {
    title: 'Kh\u00e1m ph\u00e1 ch\u1ee7 \u0111\u1ec1 & h\u1ecdc 5 t\u1eeb',
    description: 'Ch\u1ecdn m\u1ed9t ch\u1ee7 \u0111\u1ec1 y\u00eau th\u00edch v\u00e0 b\u1eaft \u0111\u1ea7u h\u1ecdc t\u1eeb v\u1ef1ng',
    href: '/topics',
    iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#3B82F6',
    checkFn: (s) => s.totalWordsLearned >= 5,
  },
  {
    title: 'Ch\u01a1i 1 tr\u00f2 ch\u01a1i \u0111\u1ec3 \u00f4n t\u1eadp',
    description: 'Luy\u1ec7n t\u1eadp t\u1eeb v\u1ef1ng qua mini-game vui nh\u1ed9n',
    href: '/games',
    iconPath: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#8B5CF6',
    checkFn: (s) => s.gamesPlayed >= 1,
  },
  {
    title: 'H\u1ecdc 1 b\u00e0i ng\u1eef ph\u00e1p',
    description: 'N\u1eafm v\u1eefng c\u1ea5u tr\u00fac c\u00e2u ti\u1ebfng \u0110\u1ee9c c\u01a1 b\u1ea3n',
    href: '/grammar',
    iconPath: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
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

  // Hide journey once all steps are done
  if (completedCount >= STEPS.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const level = (user as any)?.preferredLevel as string || 'A1';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: 'rgba(99,102,241,0.15)',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {`H\u00e0nh tr\u00ecnh ng\u00e0y \u0111\u1ea7u ti\u00ean`}
              </h3>
              <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                {`Ho\u00e0n th\u00e0nh 3 b\u01b0\u1edbc \u0111\u1ec3 b\u1eaft \u0111\u1ea7u h\u1ecdc ${level}`}
              </p>
            </div>
          </div>
          <span
            className="text-[13px] font-bold px-3 py-1 rounded-lg"
            style={{
              background: completedCount > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
              color: completedCount > 0 ? '#22C55E' : '#3B82F6',
            }}
          >
            {completedCount}/{STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(completedCount / STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 pb-5 space-y-2.5 mt-1">
        {STEPS.map((step, i) => {
          const done = step.checkFn(stats);
          return (
            <Link
              key={i}
              href={step.href}
              className="flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 group"
              style={{
                backgroundColor: done ? 'rgba(34,197,94,0.06)' : 'var(--theme-bg-card)',
                border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : 'var(--theme-border)'}`,
              }}
            >
              {/* Step number / check */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{
                  background: done
                    ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                    : `${step.color}15`,
                }}
              >
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-[13px] font-bold" style={{ color: step.color }}>
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-[14px] font-semibold ${done ? 'line-through' : ''}`}
                  style={{ color: done ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)' }}
                >
                  {step.title}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                  {step.description}
                </div>
              </div>

              {/* Arrow */}
              {!done && (
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={step.color}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
