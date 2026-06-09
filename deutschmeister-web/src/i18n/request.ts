import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

// Add a namespace here when a new messages/<locale>/<ns>.json is created.
// Phase 1 ships 4 namespaces — refactoring more features will append more here.
const NAMESPACES = ['common', 'nav', 'auth', 'metadata', 'dashboard', 'header', 'settings', 'games', 'practice', 'vocabulary', 'progress', 'landing', 'errors', 'account', 'onboarding', 'studyPlan', 'learn', 'arena', 'speakingRooms', 'subscription', 'support'] as const;

type Namespace = (typeof NAMESPACES)[number];
type MessageBag = Record<Namespace, Record<string, unknown>>;

async function loadMessages(locale: string): Promise<MessageBag> {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = (await import(`../../messages/${locale}/${ns}.json`)) as { default: Record<string, unknown> };
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries) as MessageBag;
}

// Walk a dotted "ns.path.to.key" through a message bag and return the leaf
// string if found, else null. Used to resolve a missing key against the
// default-locale messages (= our fallback source).
function resolveDottedKey(bag: MessageBag, namespace: Namespace, key: string): string | null {
  const path = key.split('.');
  let current: unknown = bag[namespace];
  for (const segment of path) {
    if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages = await loadMessages(locale);
  // Only load the fallback bag when current locale ≠ default — saves one
  // dynamic import per request for vi (the majority case).
  const fallback =
    locale === routing.defaultLocale ? null : await loadMessages(routing.defaultLocale);

  return {
    locale,
    messages,
    onError(error) {
      // Surface missing-message issues during development; production stays silent
      // so a single missing key in en/de never spams logs.
      if (error.code === 'MISSING_MESSAGE' && process.env.NODE_ENV !== 'production') {
        console.warn('[i18n]', error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      if (!fallback || !namespace) return `${namespace ?? ''}.${key}`;
      const resolved = resolveDottedKey(fallback, namespace as Namespace, key);
      return resolved ?? `${namespace}.${key}`;
    },
  };
});
