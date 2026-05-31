'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { usePronunciation } from '@/hooks/usePronunciation';
import type { IpaSymbol } from '@/lib/data/ipaChart';
import { IPA_CATEGORY_LABELS } from '@/lib/data/ipaChart';

const DIFFICULTY_BADGE: Record<NonNullable<IpaSymbol['difficultyForVi']>, { bg: string; text: string; labelKey: string }> = {
  high:   { bg: 'rgba(239,68,68,.1)',   text: STATUS.danger,  labelKey: 'diffHigh' },
  medium: { bg: 'rgba(245,158,11,.1)',  text: STATUS.warning, labelKey: 'diffMedium' },
  low:    { bg: 'rgba(34,197,94,.1)',   text: STATUS.success, labelKey: 'diffLow' },
};

interface IpaDetailPanelProps {
  symbol: IpaSymbol;
  onClose: () => void;
}

export function IpaDetailPanel({ symbol, onClose }: IpaDetailPanelProps) {
  const t = useTranslations('practice.pronunciation.ipa');
  const { speak } = usePronunciation();
  const diff = symbol.difficultyForVi ? DIFFICULTY_BADGE[symbol.difficultyForVi] : null;

  return (
    <div
      className="rounded-2xl border p-5 shadow-2xl"
      style={{
        borderColor: `${ACCENT.examWriting}40`,
        // Solid card base + faint accent tint (opaque so it reads as a dialog).
        background: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT.examWriting} 7%, var(--theme-bg-card)), var(--theme-bg-card))`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="font-mono font-bold leading-none shrink-0"
            style={{ color: ACCENT.examWriting, fontSize: '2.5rem' }}
          >
            /{symbol.ipa}/
          </div>
          <div className="min-w-0">
            <h2
              className="text-lg font-bold truncate"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {symbol.nameVi}
            </h2>
            <div
              className="text-xs italic truncate"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {symbol.nameDe} · {IPA_CATEGORY_LABELS[symbol.category]}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {diff && (
          <span
            className="px-2 py-0.5 rounded-md text-caption font-bold"
            style={{ backgroundColor: diff.bg, color: diff.text }}
          >
            {t(diff.labelKey as 'diffHigh')}
          </span>
        )}
        {symbol.spellings.map(sp => (
          <span
            key={sp}
            className="px-2 py-0.5 rounded-md text-caption font-mono"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-secondary)',
              border: '1px solid var(--theme-border)',
            }}
          >
            {sp}
          </span>
        ))}
      </div>

      {/* Tip */}
      <div
        className="rounded-xl p-3 mb-4"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
        }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-1"
          style={{ color: ACCENT.examWriting }}
        >
          {t('tipTitle')}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
          {symbol.tipVi}
        </p>
      </div>

      {/* Examples */}
      <div className="mb-4">
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('examples', { count: symbol.examples.length })}
        </div>
        <div className="space-y-1.5">
          {symbol.examples.map(ex => (
            <div
              key={ex.word}
              className="flex items-center gap-3 rounded-xl border p-2.5"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg-card)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {ex.word}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {ex.translationVi}
                </div>
              </div>
              <button
                type="button"
                onClick={() => speak(ex.word)}
                aria-label={t('pronounceAria', { word: ex.word })}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                style={{ background: GRADIENT.pronunciation, color: 'white' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Deep-link to phoneme drill */}
      {symbol.drillPhonemeKey && (
        <Link
          href={`/practice-test/pronunciation/drills/${symbol.drillPhonemeKey}`}
          className="block rounded-xl p-3 text-center font-semibold text-sm transition-transform hover:scale-[1.01]"
          style={{ background: GRADIENT.pronunciation, color: 'white' }}
        >
          {t('deepDrill')}
        </Link>
      )}
    </div>
  );
}
