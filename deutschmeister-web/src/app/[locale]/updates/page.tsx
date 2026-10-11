'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui';
import { ReleaseHighlights } from '@/components/updates/UpdateAnnouncement';
import { APP_RELEASE, openReleaseNotes } from '@/config/release';

export default function UpdatesPage() {
  const t = useTranslations('common.release');
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <p className="text-caption">
        {t('badge', { version: APP_RELEASE.version })}
      </p>
      <h1 className="text-h1 font-semibold">{t('title')}</h1>
      <p style={{ color: 'var(--theme-text-muted)' }}>{t('intro')}</p>
      <ReleaseHighlights />
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/games" className="text-body font-semibold" style={{ color: 'var(--accent)' }}>
          {t('games')}
        </Link>
        <Button variant="secondary" onClick={openReleaseNotes}>
          {t('reopen')}
        </Button>
        <Link
          href="/learning-session"
          className="text-body font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          {t('start')}
        </Link>
      </div>
    </main>
  );
}
