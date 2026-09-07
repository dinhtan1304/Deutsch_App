import type { MetadataRoute } from 'next';
import { fetchTopics, fetchGrammarLessons } from '@/lib/seo/content';

const BASE_URL = 'https://www.deutschmeister.vn';

/**
 * Regenerate daily. The content set changes when topics or lessons are added,
 * which is a matter of weeks, so anything shorter just re-queries for the same
 * answer.
 */
export const revalidate = 86400;

/**
 * The sitemap listed fourteen hand-written URLs while the database held 198
 * topics and 32 grammar lessons — the entire content library was invisible to
 * search. Those pages only became worth submitting once they stopped
 * advertising themselves as duplicates (see the `[slug]` layouts, which give
 * each one its own canonical and title); a sitemap full of self-declared
 * duplicates would have achieved nothing.
 *
 * Word pages are deliberately absent: 41,884 of them have no route yet. That is
 * its own piece of work, not a line in this file.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/games`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/practice-test`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/grammar`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/topics`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/practice-test/reading`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/practice-test/writing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/practice-test/listening`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/practice-test/speaking`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/auth/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE_URL}/auth/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // A sitemap that 500s is worse than a short one, and both helpers already
  // swallow their own failures — so a bad deploy degrades to the static list.
  const [topics, lessons] = await Promise.all([fetchTopics(), fetchGrammarLessons()]);

  const topicRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${BASE_URL}/topics/${topic.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const grammarRoutes: MetadataRoute.Sitemap = lessons.map((lesson) => ({
    url: `${BASE_URL}/grammar/${lesson.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    // Grammar lessons are long-form explanations and the strongest search
    // material here, so they outrank a topic word list.
    priority: 0.7,
  }));

  return [...staticRoutes, ...grammarRoutes, ...topicRoutes];
}
