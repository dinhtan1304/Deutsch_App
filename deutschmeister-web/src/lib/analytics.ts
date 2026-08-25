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

// ── Activation funnel ──────────────────────────────────────────────────────
// The acquisition events above stop at sign_up, which is why the drop-off
// after registration was invisible. These cover the stretch that actually
// decides retention: first practice done, and what blocks it.

/** Onboarding quiz opened. */
export const trackOnboardingStart = () => trackEvent('onboarding_start');

/** Onboarding finished. `level` is the placement result, `skipped` if they bailed to the end. */
export const trackOnboardingComplete = (level: string, skipped = false) =>
  trackEvent('onboarding_complete', { level, skipped });

/**
 * First learning activity of the session finished — the moment the product
 * delivers anything. `feature` is the surface (srs, game, grammar, …).
 */
export const trackPracticeComplete = (feature: string) =>
  trackEvent('practice_complete', { feature });

/** Free-tier quota refused an action. `feature` is what they were denied. */
export const trackQuotaHit = (feature: string) =>
  trackEvent('quota_hit', { feature });

/** Paywall or upgrade prompt shown. `context` is what triggered it. */
export const trackPaywallView = (context: string) =>
  trackEvent('paywall_view', { context });

/** Arrived from a reminder email or push — set from the `src` query param. */
export const trackReminderClick = (channel: 'email' | 'push') =>
  trackEvent('reminder_click', { channel });

/**
 * Our own web-push opt-in banner: 'accepted' or 'dismissed'. Distinct from the
 * browser's permission dialog — we only spend that one if the user says yes
 * here first, so the two rates are worth watching separately.
 */
export const trackPushPrompt = (stage: 'accepted' | 'dismissed') =>
  trackEvent('push_prompt', { stage });

/** PWA install: 'prompt' shown, 'accepted', or 'dismissed'. */
export const trackPwaInstall = (stage: 'prompt' | 'accepted' | 'dismissed') =>
  trackEvent('pwa_install', { stage });
