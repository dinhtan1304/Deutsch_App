'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT } from '@/lib/tokens';

export function CommunityRules() {
  const t = useTranslations('speakingRooms.components');
  const [open, setOpen] = useState(false);

  const RULES = [t('rule1'), t('rule2'), t('rule3'), t('rule4'), t('rule5')];

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-dotted underline-offset-4"
        style={{ color: ACCENT.speaking }}
        aria-expanded={open}
      >
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
        {t('rulesTitle')}
      </button>

      {open && (
        <div
          className="absolute bottom-7 right-0 z-20 w-[min(320px,calc(100vw-32px))] rounded-lg border p-4 text-left shadow-xl"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        >
          <div className="mb-3 flex items-center gap-2 font-bold">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ACCENT.speaking} strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-5" />
            </svg>
            {t('rulesTitle')}
          </div>
          <ul className="space-y-2.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ACCENT.speaking }} />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
