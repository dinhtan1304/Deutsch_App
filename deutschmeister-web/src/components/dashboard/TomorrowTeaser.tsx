'use client';

import { useTranslations } from 'next-intl';
import { useProgressStats } from '@/hooks/useProgress';
import { useIsAuthenticated } from '@/stores/authStore';
import { ACCENT, RADIUS } from '@/lib/tokens';

/**
 * Shown on session-completion screens: what is waiting tomorrow.
 *
 * Only 4.4% of new signups reach three study days in their first week, while
 * 25% come back on day two — so the drop is not "they never returned", it is
 * "nothing pulled them into a third day". Finishing a session is the one moment
 * a learner is receptive to hearing about the next one, and "12 words will be
 * ready tomorrow" is a reason to return where "keep it up" is not.
 *
 * Renders nothing when there is nothing waiting: an empty promise is worse than
 * no promise.
 */
export function TomorrowTeaser() {
  const t = useTranslations('progress.review');
  const isAuthenticated = useIsAuthenticated();
  const { data } = useProgressStats(isAuthenticated);
  const count = data?.dueTomorrow ?? 0;

  if (count <= 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 16,
        padding: '12px 14px',
        borderRadius: RADIUS.md,
        backgroundColor: `${ACCENT.srs}14`,
        border: `1px solid ${ACCENT.srs}33`,
      }}
    >
      <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>📅</span>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--theme-text-secondary)', textAlign: 'left' }}>
        {t('tomorrowTeaser', { count })}
      </p>
    </div>
  );
}
