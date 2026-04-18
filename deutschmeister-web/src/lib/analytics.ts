declare function gtag(...args: unknown[]): void;

export const GA_ID = 'G-SJW3F99K8R';

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window === 'undefined' || typeof gtag === 'undefined') return;
  gtag('event', eventName, params);
}
