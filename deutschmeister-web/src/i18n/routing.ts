import { defineRouting } from 'next-intl/routing';

// Single source of truth for locale config. Both the middleware and
// the locale-aware navigation helpers consume this. Adding a new locale
// only requires touching this file + messages/<code>/* + the IntlMessages
// type augmentation in src/types/i18n.d.ts.
export const routing = defineRouting({
  locales: ['vi', 'en', 'de'],
  defaultLocale: 'vi',
  // 'as-needed': default locale (vi) has NO prefix → /dashboard stays /dashboard,
  // other locales get a prefix → /en/dashboard, /de/dashboard. Keeps existing
  // URLs working without redirects.
  localePrefix: 'as-needed',
  // Detection priority handled by next-intl: cookie → Accept-Language → default.
  localeDetection: true,
  localeCookie: {
    name: 'NEXT_LOCALE',
    // 1 year — long enough that users rarely re-detect from headers.
    maxAge: 60 * 60 * 24 * 365,
    // MUST be '/' — without it next-intl falls back to `basePath || undefined`,
    // which makes the browser scope the cookie to the request's directory
    // (e.g. a cookie issued on /en/* is scoped to /en and is NOT sent on the
    // unprefixed Vietnamese routes). That dropped the cookie on F5/navigation,
    // so detection fell through to Accept-Language and reverted vi → en.
    path: '/',
  },
});

export type AppLocale = (typeof routing.locales)[number];
