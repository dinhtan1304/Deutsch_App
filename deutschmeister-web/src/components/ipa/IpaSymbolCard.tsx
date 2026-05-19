'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { usePronunciation } from '@/hooks/usePronunciation';
import type { IpaSymbol } from '@/lib/data/ipaChart';

const DIFFICULTY_DOT: Record<NonNullable<IpaSymbol['difficultyForVi']>, string> = {
  high: STATUS.danger,
  medium: STATUS.warning,
  low: STATUS.success,
};

interface IpaSymbolCardProps {
  symbol: IpaSymbol;
  active: boolean;
  onSelect: (symbol: IpaSymbol) => void;
}

export function IpaSymbolCard({ symbol, active, onSelect }: IpaSymbolCardProps) {
  const { speak } = usePronunciation();
  const firstExample = symbol.examples[0]?.word;

  const handlePlay = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (firstExample) speak(firstExample);
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(symbol);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(symbol)}
      onKeyDown={handleKey}
      aria-pressed={active}
      className="relative rounded-2xl border p-3 sm:p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2"
      style={{
        borderColor: active ? ACCENT.examWriting : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxShadow: active ? `0 0 0 2px ${ACCENT.examWriting}33` : undefined,
      }}
    >
      {symbol.difficultyForVi && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ backgroundColor: DIFFICULTY_DOT[symbol.difficultyForVi] }}
          aria-label={`Độ khó: ${symbol.difficultyForVi}`}
        />
      )}

      <div
        className="font-mono font-bold leading-none mb-2"
        style={{
          color: ACCENT.examWriting,
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
        }}
      >
        /{symbol.ipa}/
      </div>

      <div
        className="text-xs font-medium truncate mb-1"
        style={{ color: 'var(--theme-text-primary)' }}
      >
        {symbol.nameVi}
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {symbol.spellings.slice(0, 2).map(sp => (
          <span
            key={sp}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            {sp}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[11px] truncate flex-1 min-w-0"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {firstExample}
        </span>
        <button
          type="button"
          onClick={handlePlay}
          aria-label={`Phát âm ${firstExample}`}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{
            backgroundColor: `${ACCENT.examWriting}1A`,
            color: ACCENT.examWriting,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
