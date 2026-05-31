'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useWeeklyChallenges } from '@/hooks/useChallenges';
import { IconArrowRight } from '@/components/ui/Icons';

// v2 "Thử thách tuần" — violet header, task rows with progress, details CTA.
export function WeeklyChallengesWidget() {
  const t = useTranslations('dashboard.weeklyChallenges');
  const { data, isLoading } = useWeeklyChallenges();
  const total = data?.length ?? 0;
  const completedCount = data?.filter((c) => c.completed).length ?? 0;

  return (
    <section className="rounded-2xl p-4.5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-5.5 h-5.5 rounded-md inline-flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--v2-violet, #A78BFA) 16%, transparent)', color: 'var(--v2-violet, #A78BFA)' }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 3 2.4 4.9L18 8.7l-4 3.9.9 5.4-4.9-2.5L5 18l.9-5.4-4-3.9 5.6-.8L10 3Z" /></svg>
          </span>
          <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t('title')}</span>
        </div>
        <span className="mono text-caption" style={{ color: 'var(--theme-text-muted)' }}>{completedCount}/{total || 3}</span>
      </div>

      {isLoading && (
        <div className="text-body text-center py-3" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</div>
      )}

      <div className="flex flex-col gap-2.5">
        {data?.map((c) => {
          const pct = Math.min((c.current / c.target) * 100, 100);
          return (
            <div key={c.id}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-caption" style={{ color: c.completed ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)', textDecoration: c.completed ? 'line-through' : 'none' }}>
                  {c.titleVi}
                </span>
                <span className="mono text-caption" style={{ color: 'var(--theme-text-muted)' }}>{c.current}/{c.target}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: c.completed ? 'var(--m-learned)' : 'var(--accent)' }} />
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/challenges"
        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[9px] text-caption font-medium transition-colors"
        style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
        {t('details')} <IconArrowRight size={12} />
      </Link>
    </section>
  );
}
