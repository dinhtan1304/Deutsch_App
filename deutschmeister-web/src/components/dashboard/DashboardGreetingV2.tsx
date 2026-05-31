'use client';

import { useTranslations } from 'next-intl';
import type { XpInfo } from '@/lib/api/xp';
import { GRADIENT } from '@/lib/tokens';

interface Props {
  name: string;
  dateLabel: string;
  xpInfo?: XpInfo;
  streak?: number;
}

/** v2 dashboard hero: date + greeting (name in accent) + level meter card. */
export function DashboardGreetingV2({ name, dateLabel, xpInfo, streak = 0 }: Props) {
  const t = useTranslations('dashboard');

  // Split the localized greeting around the name so we can accent just the name.
  const SENTINEL = '␟';
  const [pre, post] = t('greeting', { name: SENTINEL }).split(SENTINEL);

  const remaining = xpInfo ? Math.max(0, xpInfo.xpNeeded) : 0;
  const nextLevel = xpInfo ? xpInfo.level + 1 : 0;

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between" style={{ marginBottom: 4 }}>
      <div className="min-w-0">
        <div
          className="text-caption font-medium uppercase"
          style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}
        >
          {dateLabel}
        </div>
        <h1
          className="mt-1.5 font-bold"
          style={{ fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-.02em', lineHeight: 1.15, color: 'var(--theme-text-primary)' }}
        >
          {pre}
          <span style={{ color: 'var(--accent)' }}>{name}</span>
          {post}
        </h1>
        {xpInfo && streak > 0 && (
          <p className="mt-2 text-body" style={{ color: 'var(--theme-text-secondary)', maxWidth: 540 }}>
            {t.rich('v2.greetingSub', {
              streak,
              level: nextLevel,
              s: (c) => <b style={{ color: 'var(--streak)' }}>{c}</b>,
              l: (c) => <b style={{ color: 'var(--theme-text-primary)' }}>{c}</b>,
            })}
          </p>
        )}
      </div>

      {/* Level meter */}
      {xpInfo && (
        <div
          className="shrink-0 rounded-2xl p-3.5"
          style={{ minWidth: 240, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
        >
          <div className="flex items-center gap-2.5 mb-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-caption mono"
              style={{ background: GRADIENT.v2Level }}
            >
              {xpInfo.level}
            </div>
            <div className="min-w-0">
              <div className="text-body font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                Lv.{xpInfo.level} · {xpInfo.nameVi}
              </div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{xpInfo.cefrLabel}</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.min(100, xpInfo.progress)}%`, background: GRADIENT.v2Level }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-caption mono" style={{ color: 'var(--theme-text-secondary)' }}>
              {xpInfo.xp.toLocaleString('de-DE')} / {xpInfo.nextLevelXp.toLocaleString('de-DE')} XP
            </span>
            <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {t('v2.toNextLevel', { xp: remaining.toLocaleString('de-DE'), level: xpInfo.level + 1 })}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
