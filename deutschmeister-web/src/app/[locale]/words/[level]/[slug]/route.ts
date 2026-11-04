import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { fetchWordBySlug } from '@/lib/seo/content';
import { renderWordNotFound, renderWordPage } from '@/lib/seo/wordPage';
import type { Word } from '@/types';

const LEVELS = /^(a1|a2|b1|b2|c1|c2)$/;
const MAX_SLUG_LENGTH = 120;

// The CDN keeps the response, so a page costs one render a month at most. No ISR:
// it is billed per 8 KB written, and crawlers rarely read a word page twice.
const CACHE_PAGE = 'public, max-age=3600, s-maxage=2592000, stale-while-revalidate=604800';
const CACHE_MISSING = 'public, max-age=300, s-maxage=86400';

function html(body: string, status: number, cacheControl: string): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cacheControl },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; level: string; slug: string }> },
) {
  const { locale: rawLocale, level: rawLevel, slug } = await params;
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;
  const level = rawLevel.toLowerCase();

  // Junk URLs from scanners never reach the API.
  if (!LEVELS.test(level) || slug.length > MAX_SLUG_LENGTH) {
    return html(renderWordNotFound(locale), 404, CACHE_MISSING);
  }

  let word: Word | null;
  try {
    word = await fetchWordBySlug<Word>(level, slug);
  } catch {
    // Tell crawlers to come back rather than caching a failure as a missing word.
    return new Response(null, { status: 503, headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' } });
  }

  if (!word) return html(renderWordNotFound(locale), 404, CACHE_MISSING);
  return html(renderWordPage(word, locale, level, slug), 200, CACHE_PAGE);
}
