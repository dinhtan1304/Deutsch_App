'use client';

import { ACCENT } from '@/lib/tokens';

const UMLAUT_CHARS = ['ä', 'ö', 'ü', 'ß'] as const;

/**
 * Tap-to-insert German special characters into the focused blank.
 * Buttons use onPointerDown+preventDefault so the blank keeps focus.
 */
export function UmlautToolbar({ onInsert, className = '' }: {
  onInsert: (ch: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {UMLAUT_CHARS.map(ch => (
        <button
          key={ch}
          type="button"
          aria-label={ch}
          onPointerDown={e => e.preventDefault()}
          onClick={() => onInsert(ch)}
          className="flex h-8 w-9 items-center justify-center rounded-lg text-body font-bold transition-colors active:scale-95"
          style={{
            background: 'var(--theme-bg-secondary)',
            color: 'var(--theme-text-primary)',
            border: '1px solid var(--theme-border)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = ACCENT.dictation;
            e.currentTarget.style.color = ACCENT.dictation;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--theme-border)';
            e.currentTarget.style.color = 'var(--theme-text-primary)';
          }}
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
