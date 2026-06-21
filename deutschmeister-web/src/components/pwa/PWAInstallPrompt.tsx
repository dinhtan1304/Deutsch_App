'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { trackPwaInstall } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'dm-pwa-dismissed';
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  const iDevice = /iphone|ipad|ipod/i.test(ua);
  // Exclude in-app browsers (FB/Zalo) where A2HS isn't available.
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return iDevice && safari;
}

/**
 * Registers the service worker and surfaces an install affordance:
 * a banner driven by `beforeinstallprompt` on Android/desktop Chrome, or an
 * "Add to Home Screen" hint on iOS Safari (which has no install event).
 * Hidden in standalone mode or for 14 days after dismissal.
 */
export function PWAInstallPrompt() {
  const t = useTranslations('common.pwa');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  // Lazy init (client-only) so iOS — which never fires `beforeinstallprompt` —
  // gets a manual A2HS hint without a setState-in-effect.
  const [showIosHint, setShowIosHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isIos() && !isStandalone() && !recentlyDismissed();
  });

  // Register the service worker (production only — avoids HMR cache issues in dev).
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }, []);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      trackPwaInstall('prompt');
    };
    window.addEventListener('beforeinstallprompt', onBip);

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDeferred(null);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    trackPwaInstall(outcome);
    setDeferred(null);
    if (outcome === 'dismissed') dismiss();
  };

  if (!deferred && !showIosHint) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-60 p-3 sm:p-4 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <div
        className="pointer-events-auto w-full max-w-md rounded-2xl p-4 flex items-center gap-3 shadow-lg"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={44} height={44} className="rounded-xl shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('installTitle')}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {showIosHint && !deferred ? t('iosHint') : t('installBody')}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {deferred && (
            <button
              onClick={install}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'var(--accent)' }}
            >
              {t('installCta')}
            </button>
          )}
          <button
            onClick={dismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {t('dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
