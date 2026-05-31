'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconFlame, IconTarget, IconRefresh, IconCheck } from '@/components/ui/Icons';
import type { SRSStats } from '@/lib/api/personal-words';

interface SRSBannerProps {
  srsStats: SRSStats;
  statTotal: number;
}

// v2 "due" hero — calm card: left accent rail + icon box + count + actions.
export function SRSBanner({ srsStats, statTotal }: SRSBannerProps) {
  const t = useTranslations('vocabulary.wordBank.srsBanner');
  const isDue = srsStats.due > 0;
  const accent = isDue ? 'var(--streak)' : 'var(--v2-success, #4ADE80)';

  return (
    <div
      className="relative overflow-hidden mb-6 p-5 rounded-[14px] border flex flex-wrap items-center gap-4"
      style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderLeft: `3px solid ${accent}` }}
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isDue ? 'var(--streak-soft)' : 'color-mix(in srgb, var(--v2-success, #4ADE80) 14%, transparent)', color: accent }}
      >
        {isDue ? <IconFlame size={22} /> : <IconCheck size={22} />}
      </span>

      <div className="flex-1 min-w-50">
        <p className="font-bold" style={{ fontSize: 16, color: 'var(--theme-text-primary)' }}>
          {isDue
            ? t.rich('dueLine', { due: srsStats.due, b: (chunks) => <span className="mono" style={{ color: accent }}>{chunks}</span> })
            : <span style={{ color: accent }}>{t('allDone')}</span>}
        </p>
        <div className="flex items-center gap-3 mt-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
          <span>{t('matureLine', { mature: srsStats.mature, total: statTotal, pct: Math.round((srsStats.mature / Math.max(1, statTotal)) * 100) })}</span>
          {srsStats.new > 0 && <span>• {t('newWords', { count: srsStats.new })}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isDue && (
          <Link
            href="/word-bank/review?mode=weak"
            className="flex items-center gap-1.5 h-9.5 px-3.5 rounded-[10px] font-semibold text-body transition-transform hover:-translate-y-0.5"
            style={{ background: 'transparent', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}
          >
            <IconTarget size={14} /> {t('weakWords')}
          </Link>
        )}
        <Link
          href="/word-bank/review"
          className="flex items-center gap-1.5 h-9.5 px-4.5 rounded-[10px] font-bold text-body transition-transform hover:-translate-y-0.5"
          style={{ background: accent, color: 'var(--accent-on)', boxShadow: `0 4px 12px color-mix(in srgb, ${accent} 35%, transparent)` }}
        >
          <IconRefresh size={14} /> {isDue ? t('reviewNow') : t('learnMore')}
        </Link>
      </div>
    </div>
  );
}
