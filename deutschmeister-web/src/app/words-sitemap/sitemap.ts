import type { MetadataRoute } from 'next';
import { fetchWordSlugs } from '@/lib/seo/content';

const BASE_URL = 'https://www.deutschmeister.vn';

/** Google's ceiling is 50,000 URLs per file; well under it leaves room to grow. */
const URLS_PER_SITEMAP = 10000;

export const revalidate = 86400;

/**
 * Word pages, split across numbered sitemap files.
 *
 * There are 41,262 of them, which would fit in one file today and stop fitting
 * the moment the vocabulary grows past 50,000. Splitting now costs nothing and
 * keeps each file small enough to fetch and diff by hand when something looks
 * wrong.
 *
 * Kept out of the main sitemap deliberately: that one lists 244 pages a human
 * curated, and burying them among forty thousand generated URLs would make it
 * useless to read. Both are referenced from robots.txt.
 */
export async function generateSitemaps() {
  const slugs = await fetchWordSlugs();
  const count = Math.max(1, Math.ceil(slugs.length / URLS_PER_SITEMAP));
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number | Promise<number> }): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchWordSlugs();
  const now = new Date();

  // Next 16 delivers this the way it delivers route params — as a promise.
  // Reading it directly yields a Promise, whose Number() is NaN, and every file
  // then silently emitted the same first 10,000 URLs.
  const page = Number(await id) || 0;

  return slugs
    .slice(page * URLS_PER_SITEMAP, (page + 1) * URLS_PER_SITEMAP)
    .map((entry) => ({
      url: `${BASE_URL}/words/${entry.level.toLowerCase()}/${entry.slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      // Below topics (0.6) and grammar lessons (0.7). A single vocabulary entry
      // is genuinely useful but it is not what the site is for, and saying so
      // honestly is better than claiming every page matters equally.
      priority: 0.4,
    }));
}
