declare function gtag(...args: unknown[]): void;

export const GA_ID = 'G-SJW3F99K8R';

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window === 'undefined' || typeof gtag === 'undefined') return;
  gtag('event', eventName, params);
}

// ── Acquisition funnel events ──────────────────────────────────────────────
// Named wrappers so call sites stay consistent and event names live in one place.

/** Visitor started the no-login landing demo quiz. */
export const trackDemoStart = () => trackEvent('demo_start');

/** Visitor finished the landing demo quiz. */
export const trackDemoComplete = (score: number, total: number) =>
  trackEvent('demo_complete', { score, total });

/** Account created. `method` = 'email' | 'google'. Uses the GA4-standard `sign_up` name. */
export const trackSignup = (method: string, withReferral = false) =>
  trackEvent('sign_up', { method, with_referral: withReferral });

/** A referral code was applied on the register form. */
export const trackReferralApplied = (code: string) =>
  trackEvent('referral_code_applied', { code });

/** User shared a result/score card. */
export const trackShareResult = (skill: string, score: number, withReferral = false) =>
  trackEvent('share_result', { skill, score, with_referral: withReferral });

/** PWA install: 'prompt' shown, 'accepted', or 'dismissed'. */
export const trackPwaInstall = (stage: 'prompt' | 'accepted' | 'dismissed') =>
  trackEvent('pwa_install', { stage });
