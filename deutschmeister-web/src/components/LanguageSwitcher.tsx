'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { ACCENT } from '@/lib/tokens';
import type { AppLocale } from '@/i18n/routing';

const LOCALES: ReadonlyArray<{ code: AppLocale; flag: string; nativeLabel: string }> = [
  { code: 'vi', flag: '🇻🇳', nativeLabel: 'Tiếng Việt' },
  { code: 'en', flag: '🇬🇧', nativeLabel: 'English' },
  { code: 'de', flag: '🇩🇪', nativeLabel: 'Deutsch' },
];

const monoGradient = (color: string) => `linear-gradient(135deg, ${color}, ${color}cc)`;

/**
 * Renders a 3-button locale picker matching the segmented-control look used
 * elsewhere in /settings. Switching:
 *   1. Persists to localStorage (mirror — analytics, non-React code, etc.)
 *   2. Calls next-intl router.replace, which (a) updates the URL per the
 *      'as-needed' strategy, and (b) re-issues the NEXT_LOCALE cookie via
 *      its built-in Set-Cookie response.
 * We wrap the navigation in `useTransition` so React keeps the current UI
 * mounted until the new locale's content is ready — avoids a flash of
 * untranslated text during the switch.
 */
export function LanguageSwitcher({ variant = 'grid' }: { variant?: 'grid' | 'compact' }) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const [pending, startTransition] = useTransition();

  const onPick = (next: AppLocale) => {
    if (next === locale || pending) return;
    try {
      // Mirror the choice into localStorage so non-React code (analytics
      // bootstrap, theme script) can read it without parsing cookies.
      localStorage.setItem('app-locale', next);
    } catch {
      // Storage may be unavailable (private mode, quota); cookie is the
      // source of truth so this isn't fatal.
    }
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-1 rounded-full border p-0.5"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
        aria-busy={pending}
      >
        {LOCALES.map((opt) => {
          const isActive = opt.code === locale;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => onPick(opt.code)}
              disabled={pending}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-60"
              style={{
                background: isActive ? ACCENT.brand : 'transparent',
                color: isActive ? 'white' : 'var(--theme-text-primary)',
              }}
              aria-pressed={isActive}
              title={opt.nativeLabel}
            >
              <span aria-hidden className="mr-1">{opt.flag}</span>
              {opt.code.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <label className="block text-[11px] font-black uppercase tracking-widest opacity-40 mb-4 px-1">
        {t('language.label')}
      </label>
      <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-busy={pending}>
        {LOCALES.map((opt) => {
          const isActive = opt.code === locale;
          const color = ACCENT.brand;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => onPick(opt.code)}
              disabled={pending}
              role="radio"
              aria-checked={isActive}
              className={`relative p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] text-center disabled:opacity-60 disabled:hover:scale-100 ${isActive ? 'shadow-md' : ''}`}
              style={{
                borderColor: isActive ? color : 'var(--theme-border)',
                backgroundColor: isActive ? `${color}10` : 'transparent',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2.5 transition-colors text-xl"
                style={{
                  background: isActive ? monoGradient(color) : 'var(--theme-bg-secondary)',
                  color: isActive ? 'white' : 'var(--theme-text-muted)',
                }}
                aria-hidden
              >
                {opt.flag}
              </div>
              <div
                className="text-caption font-black tracking-tight"
                style={{ color: isActive ? color : 'var(--theme-text-primary)' }}
              >
                {opt.nativeLabel}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
        {t('language.description')}
      </p>
    </div>
  );
}
