'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { WeeklyProgress } from '@/types/dashboard';

interface Props {
  data: WeeklyProgress[];
  streak: number;
  bestStreak?: number;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/** v2 seven-day vocab bar chart with hover tooltip + summary footer. */
const BAR_AREA = 120; // px – chiều cao vùng vẽ thanh

export function ProgressChartV2({ data, streak, bestStreak }: Props) {
  const t = useTranslations('dashboard');
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.wordsLearned));
  const total = data.reduce((s, d) => s + d.wordsLearned, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const today = todayStr();

  return (
    <section className="rounded-2xl p-5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <div className="mb-5">
        <h3 className="font-semibold text-lead" style={{ color: 'var(--theme-text-primary)' }}>{t('weeklyChart.title')}</h3>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="mono font-bold" style={{ fontSize: 28, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{total}</span>
          <span className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('v2.wordsReviewed')}</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex gap-2.5 items-end">
        {data.map((d, i) => {
          const isToday = d.date === today;
          const h = (d.wordsLearned / max) * BAR_AREA;
          const isHover = hover === i;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-2 relative"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {isHover && (
                <div
                  className="absolute -top-8 px-2 py-1 rounded-md text-caption whitespace-nowrap z-10"
                  style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                >
                  <b className="mono">{d.wordsLearned}</b> · <b className="mono">{d.gamesPlayed}</b>🎮
                </div>
              )}
              <div className="w-full flex items-end justify-center" style={{ height: BAR_AREA }}>
                <div
                  className={`relative w-full rounded-md transition-transform ${isToday ? 'v2-bar-today' : 'v2-bar'}`}
                  style={{
                    maxWidth: 36,
                    height: Math.max(4, h),
                    border: isToday ? '1px solid var(--accent)' : '1px solid var(--theme-border)',
                    transform: isHover ? 'scaleY(1.02)' : undefined,
                    transformOrigin: 'bottom',
                  }}
                >
                  {isToday && d.wordsLearned > 0 && (
                    <span className="mono absolute left-1/2 -translate-x-1/2 -top-5.5 text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
                      {d.wordsLearned}
                    </span>
                  )}
                </div>
              </div>
              <span
                className="text-caption"
                style={{ color: isToday ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)', fontWeight: isToday ? 700 : 500 }}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex gap-6 mt-4 pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <FooterStat label={t('v2.avgPerDay')} value={`${avg}`} />
        <FooterStat label={t('v2.currentStreak')} value={`${streak} 🔥`} color="var(--streak)" />
        {bestStreak != null && <FooterStat label={t('v2.best')} value={`${bestStreak}`} />}
      </div>
    </section>
  );
}

function FooterStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-caption mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      <div className="mono font-semibold" style={{ fontSize: 15, color: color ?? 'var(--theme-text-primary)' }}>{value}</div>
    </div>
  );
}
