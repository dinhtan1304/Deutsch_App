import type { MetadataRoute } from 'next';
import { fetchWordSlugs } from '@/lib/seo/content';

const BASE_URL = 'https://www.deutschmeister.vn';

/** Must match URLS_PER_SITEMAP in words-sitemap/sitemap.ts. */
const URLS_PER_SITEMAP = 10000;

export const revalidate = 86400;

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
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/auth/callback'],
    },
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      ...Array.from(
        { length: wordSitemapCount },
        (_, i) => `${BASE_URL}/words-sitemap/sitemap/${i}.xml`,
      ),
    ],
  };
}
