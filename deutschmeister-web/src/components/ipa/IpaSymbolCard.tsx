'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { STATUS } from '@/lib/tokens';
import { usePronunciation } from '@/hooks/usePronunciation';
import type { IpaSymbol, IpaCategory } from '@/lib/data/ipaChart';

// v2 group color-code (matches ipa.js GROUPS) — via CSS vars.
const CATEGORY_COLOR: Record<IpaCategory, string> = {
  'vowel-short': 'var(--v2-cyan)',
  'vowel-long': 'var(--v2-violet)',
  'diphthong': 'var(--die)',
  'consonant': 'var(--v2-warn)',
  'affricate': 'var(--streak)',
};

const DIFFICULTY_DOT: Record<NonNullable<IpaSymbol['difficultyForVi']>, string> = {
  high: STATUS.danger,
  medium: STATUS.warning,
  low: STATUS.success,
};
const DIFFICULTY_KEY: Record<NonNullable<IpaSymbol['difficultyForVi']>, 'diffShortHigh' | 'diffShortMed' | 'diffShortLow'> = {
  high: 'diffShortHigh',
  medium: 'diffShortMed',
  low: 'diffShortLow',
};

interface IpaSymbolCardProps {
  symbol: IpaSymbol;
  active: boolean;
  onSelect: (symbol: IpaSymbol) => void;
}

export function IpaSymbolCard({ symbol, active, onSelect }: IpaSymbolCardProps) {
  const t = useTranslations('practice.pronunciation.ipa');
  const { speak } = usePronunciation();
  const firstExample = symbol.examples[0]?.word;
  const color = CATEGORY_COLOR[symbol.category] ?? 'var(--accent)';
  const diff = symbol.difficultyForVi;

  const handlePlay = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (firstExample) speak(firstExample);
  };
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(symbol); }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(symbol)}
      onKeyDown={handleKey}
      aria-pressed={active}
      className="word-card-v2 relative rounded-[13px] p-3.5 flex flex-col gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: `1px solid ${active ? color : 'var(--theme-border)'}`,
        ['--card-accent' as string]: color,
      } as React.CSSProperties}
    >
      {/* Top: difficulty chip + dot */}
      <div className="flex items-center justify-between">
        {diff ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            style={{ background: `color-mix(in srgb, ${DIFFICULTY_DOT[diff]} 14%, transparent)`, color: DIFFICULTY_DOT[diff], letterSpacing: '.04em' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFFICULTY_DOT[diff] }} />
            {t(DIFFICULTY_KEY[diff])}
          </span>
        ) : <span />}
      </div>

      {/* IPA hero */}
      <div className="text-center py-1.5">
        <div className="mono font-bold leading-none" style={{ fontSize: 40, letterSpacing: '-.04em', color }}>
          /{symbol.ipa}/
        </div>
        <div className="mt-1.5 text-caption font-medium truncate" style={{ color: 'var(--theme-text-secondary)' }}>{symbol.nameVi}</div>
        <div className="mt-1 flex gap-1 justify-center flex-wrap">
          {symbol.spellings.slice(0, 3).map(sp => (
            <span key={sp} className="mono px-1.5 py-px rounded text-[10.5px]"
              style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>{sp}</span>
          ))}
        </div>
      </div>

      {/* Example + play */}
      <div className="flex items-center justify-between gap-2 pt-2.5" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <div className="min-w-0 flex-1">
          <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{t('exampleLabel')}</div>
          <div className="text-caption font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>{firstExample}</div>
        </div>
        <button
          type="button"
          onClick={handlePlay}
          aria-label={t('pronounceAria', { word: firstExample ?? '' })}
          className="w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 transition-transform hover:scale-110"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 6c1.2 1 2 2.4 2 4s-.8 3-2 4M11 4c2.4 1.4 4 4 4 6s-1.6 4.6-4 6M3 8h2l4-3v10l-4-3H3V8Z" /></svg>
        </button>
      </div>
    </div>
  );
}
