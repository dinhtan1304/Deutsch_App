'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { AnimatedModal, Button, Card } from '@/components/ui';
import { IconStar, IconX } from '@/components/ui/Icons';
import { useModalA11y } from '@/hooks/useModalA11y';
import { useAuthStore } from '@/stores/authStore';
import { APP_RELEASE } from '@/config/release';
import { ACCENT } from '@/lib/tokens';

const STORAGE_KEY = `dm:release-seen:${APP_RELEASE.id}`;
let dismissedInMemory = false;

export function ReleaseHighlights() {
  const t = useTranslations('common.release');
  return (
    <div className="space-y-3">
      {APP_RELEASE.highlights.map((key) => (
        <Card key={key} variant="bordered" className="p-4">
          <h3 className="text-body font-semibold">
            {t(`highlights.${key}.title`)}
          </h3>
          <p
            className="mt-1 text-body"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {t(`highlights.${key}.body`)}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function UpdateAnnouncement() {
  const t = useTranslations('common.release');
  const pathname = usePathname();
  const router = useRouter();
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
    const show = () => setOpen(true);
    window.addEventListener('dm:release-notes', show);
    return () => window.removeEventListener('dm:release-notes', show);
  }, []);

  useEffect(() => {
    // Defer automatic announcements until a hub page; never cover an exercise,
    // an OAuth callback, onboarding, or an administrator's workflow.
    const eligible = [
      '/',
      '/dashboard',
      '/smart-review',
      '/learning-session',
      '/error-notebook',
      '/resources',
      '/settings',
      '/topics',
      '/practice-test',
      '/games',
      '/pricing',
    ].includes(pathname);
    if (!hydrated || !eligible || dismissedInMemory) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* Use the in-memory fallback. */
    }
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [hydrated, pathname]);

  return (
    <AnimatedModal open={open} onClose={close} size="lg" ariaLabel={t('title')}>
      <div
        ref={dialogRef}
        className="flex max-h-[85dvh] flex-col p-6"
        tabIndex={-1}
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <div>
            <p
              className="mb-2 flex items-center gap-2 text-caption font-semibold"
              style={{ color: ACCENT.brand }}
            >
              <IconStar size={16} />{' '}
              {t('badge', { version: APP_RELEASE.version })}
            </p>
            <h2 className="text-h2 font-semibold">{t('title')}</h2>
            <p
              className="mt-2 text-body"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {t('intro')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('close')}
            onClick={close}
          >
            <IconX size={18} />
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <ReleaseHighlights />
        </div>
        <p
          className="my-4 shrink-0 text-caption"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('once')}
        </p>
        <div className="flex shrink-0 flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => { close(); router.push('/games'); }}>
            {t('games')}
          </Button>
          <Button variant="secondary" onClick={close}>
            {t('continue')}
          </Button>
          <Button
            onClick={() => {
              close();
              router.push(isAuthenticated ? '/learning-session' : '/updates');
            }}
          >
            {t(isAuthenticated ? 'start' : 'details')}
          </Button>
        </div>
      </div>
    </AnimatedModal>
  );
}
