'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWebPush } from '@/hooks/useWebPush';
import { useUpdateSettings } from '@/hooks/useUser';
import { useAuthStore } from '@/stores/authStore';
import { SESSION_COMPLETE_EVENT } from '@/lib/pushPrompt';
import { trackPushPrompt } from '@/lib/analytics';
import { ACCENT, RADIUS, SHADOW } from '@/lib/tokens';
import { Button } from '@/components/ui/Button';

const DISMISS_KEY = 'dm-push-dismissed';
const DISMISS_DAYS = 30;

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Private mode or blocked storage — the prompt simply reappears next time.
  }
}

/**
 * Asks for notification permission right after a study session goes well.
 *
 * Web push had 2 subscribers out of 342 users, because the only way to turn it
 * on was a toggle buried in Settings. That matters beyond convenience: push is
 * unlimited and free, while email is capped per month, so every user who
 * enables it is one the reminder system can reach without spending quota.
 *
 * The browser allows exactly one permission prompt and treats a denial as
 * permanent, which is why this waits for a success screen rather than firing on
 * load. If the user declines our banner we do not spend the browser prompt at
 * all, and we stay quiet for 30 days.
 */
export function PushOptInPrompt() {
  const t = useTranslations('common.push');
  const { isSupported, permission, busy, enable } = useWebPush();
  const updateSettings = useUpdateSettings();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [visible, setVisible] = useState(false);

  const eligible = isAuthenticated && isSupported && permission === 'default';

  useEffect(() => {
    if (!eligible) return;
    const onComplete = () => {
      if (recentlyDismissed()) return;
      setVisible(true);
    };
    window.addEventListener(SESSION_COMPLETE_EVENT, onComplete);
    return () => window.removeEventListener(SESSION_COMPLETE_EVENT, onComplete);
  }, [eligible]);

  const handleEnable = useCallback(async () => {
    trackPushPrompt('accepted');
    const ok = await enable();
    if (ok) {
      // enable() has already registered the subscription; this persists the
      // preference the reminder jobs read.
      updateSettings.mutate({ webPushEnabled: true });
    } else {
      // Denied at the browser level, or the subscribe failed. Either way there
      // is nothing more to ask for — record it so we stop offering.
      rememberDismissal();
    }
    setVisible(false);
  }, [enable, updateSettings]);

  const handleDismiss = useCallback(() => {
    trackPushPrompt('dismissed');
    rememberDismissal();
    setVisible(false);
  }, []);

  if (!visible || !eligible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('title')}
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        maxWidth: 420,
        margin: '0 auto',
        zIndex: 60,
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        borderRadius: RADIUS.lg,
        boxShadow: SHADOW.lifted,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          aria-hidden
          style={{
            width: 40, height: 40, borderRadius: RADIUS.md, flexShrink: 0,
            backgroundColor: `${ACCENT.brand}1A`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}
        >
          🔔
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--theme-text-primary)', margin: 0 }}>
            {t('title')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
            {t('body')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          {t('dismiss')}
        </Button>
        <Button variant="primary" size="sm" onClick={handleEnable} isLoading={busy}>
          {t('cta')}
        </Button>
      </div>
    </div>
  );
}
