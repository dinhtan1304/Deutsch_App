'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { AnimatedModal, Button } from '@/components/ui';
import { IconInfo } from '@/components/ui/Icons';
import { useModalA11y } from '@/hooks/useModalA11y';
import { useAuthStore } from '@/stores/authStore';
import { ANNOUNCEMENT_PAGES } from '@/config/release';
import { ACCENT } from '@/lib/tokens';

/**
 * Apology for the web outage of 1-4 Nov 2026, for people who already have an
 * account: a first-time visitor has nothing to be sorry to. It stops on its own
 * at SHOW_UNTIL, so a later cleanup only has to delete this file.
 */
const STORAGE_KEY = 'dm:service-notice-seen:2026-11-outage';
const SHOW_UNTIL = Date.parse('2026-11-18T00:00:00+07:00');
let dismissedInMemory = false;

export function isServiceNoticePending(): boolean {
  if (dismissedInMemory || Date.now() >= SHOW_UNTIL) return false;
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

export function ServiceNotice() {
  const t = useTranslations('common.serviceNotice');
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    dismissedInMemory = true;
    try {
      localStorage.setItem(STORAGE_KEY, 'seen');
    } catch {
      /* Session-only dismissal when storage is unavailable. */
    }
    setOpen(false);
  }, []);
  const dialogRef = useModalA11y(open, close);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !ANNOUNCEMENT_PAGES.includes(pathname)) return;
    if (!isServiceNoticePending()) return;
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [hydrated, isAuthenticated, pathname]);

  return (
    <AnimatedModal open={open} onClose={close} size="md" ariaLabel={t('title')}>
      <div ref={dialogRef} className="p-6" tabIndex={-1}>
        <span style={{ color: ACCENT.brand }}>
          <IconInfo size={24} />
        </span>
        <h2 className="mt-3 text-h2 font-semibold">{t('title')}</h2>
        <p className="mt-2 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          {t('body')}
        </p>
        <p className="mt-2 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          {t('reassurance')}
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={close}>{t('confirm')}</Button>
        </div>
      </div>
    </AnimatedModal>
  );
}
