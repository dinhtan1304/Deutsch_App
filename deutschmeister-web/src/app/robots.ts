import type { MetadataRoute } from 'next';
import { fetchWordSlugs } from '@/lib/seo/content';
import { ROBOTS_BLOCKED_AGENTS } from '@/lib/seo/bots';

const BASE_URL = 'https://www.deutschmeister.vn';

/** Must match URLS_PER_SITEMAP in words-sitemap/sitemap.ts. */
const URLS_PER_SITEMAP = 10000;

export const revalidate = 604800;

/**
 * Replaces the static public/robots.txt.
 *
 * Word pages are split across numbered sitemap files, and how many there are
 * depends on the size of the vocabulary — hard-coding "five files" in a static
 * text file would quietly stop covering everything the first time someone
 * imports a new word list. The count is derived from the same source the
 * sitemaps page from.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const slugs = await fetchWordSlugs();
  const wordSitemapCount = Math.max(1, Math.ceil(slugs.length / URLS_PER_SITEMAP));

  return {
    rules: [
      { userAgent: ROBOTS_BLOCKED_AGENTS, disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        // Word pages are Vietnamese-first. The en/de copies tripled the crawl
        // (124k URLs instead of 41k) for an audience the site does not have yet.
        disallow: ['/admin/', '/api/', '/auth/callback', '/en/words/', '/de/words/'],
        // Honoured by Bing and most others; Googlebot paces itself and ignores it.
        crawlDelay: 5,
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      ...Array.from(
        { length: wordSitemapCount },
        (_, i) => `${BASE_URL}/words-sitemap/sitemap/${i}.xml`,
      ),
    ],
  };
}
