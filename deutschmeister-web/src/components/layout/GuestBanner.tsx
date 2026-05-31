'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { GRADIENT } from '@/lib/tokens';

const DISMISSED_KEY = 'dm-guest-banner-dismissed';

function subscribe(): () => void { return () => {}; }
function getSnapshot(): boolean { return sessionStorage.getItem(DISMISSED_KEY) === '1'; }
function getServerSnapshot(): boolean { return true; }

export function GuestBanner() {
  const t = useTranslations('common.ui');
  const { isAuthenticated } = useAuthStore();
  const storedDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  if (isAuthenticated || storedDismissed || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      className="sticky top-16 z-30 flex items-center justify-between gap-3 px-4 py-2 text-white text-sm font-medium"
      style={{ background: GRADIENT.brand }}
    >
      <span className="min-w-0 truncate">
        {t.rich('guestText', {
          a: (chunks) => (
            <Link href="/auth/register" className="underline font-bold hover:opacity-80 transition-opacity">
              {chunks}
            </Link>
          ),
        })}
      </span>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label={t('guestDismiss')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
