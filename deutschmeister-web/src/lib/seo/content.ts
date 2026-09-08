/**
 * Server-side reads of the public content endpoints, for `generateMetadata`.
 *
 * Deliberately not the shared api client: that one carries the in-memory access
 * token and its refresh machinery, both of which are meaningless during a server
 * render. These endpoints are `@Public()` and need no auth at all.
 *
 * Every call is wrapped so a failure degrades to the section default rather than
 * failing the render — a page that loads with a generic title beats a 500.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://deutschmeister-api-production.up.railway.app/api';

/** Content changes rarely and metadata is cheap to serve stale, so cache for an hour. */
const REVALIDATE_SECONDS = 3600;

export interface SeoTopic {
  slug: string;
  nameVi: string;
  nameEn: string;
  nameDe: string;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  descriptionDe?: string | null;
  level: string;
  wordCount: number;
}

export interface SeoGrammarLesson {
  slug: string;
  level: string;
  titleVi: string;
  titleEn: string;
  titleDe: string;
  lessonNumber: number;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchTopic(slug: string): Promise<SeoTopic | null> {
  return getJson<SeoTopic>(`/topics/${encodeURIComponent(slug)}`);
}

export function fetchGrammarLesson(slug: string): Promise<SeoGrammarLesson | null> {
  return getJson<SeoGrammarLesson>(`/grammar/lessons/${encodeURIComponent(slug)}`);
}

/**
 * The same two endpoints, typed for rendering rather than for metadata.
 *
 * `generateMetadata` only needs a title and a description, so `SeoTopic` and
 * `SeoGrammarLesson` describe just that much. The page components hand the whole
 * payload to the client view as `initialData`, so they take it untyped-by-us and
 * let the view's own types apply — one request either way, since Next dedupes
 * identical fetches within a render.
 */
export function fetchGrammarLessonDetail<T>(slug: string): Promise<T | null> {
  return getJson<T>(`/grammar/lessons/${encodeURIComponent(slug)}`);
}

export function fetchTopicDetail<T>(slug: string): Promise<T | null> {
  return getJson<T>(`/topics/${encodeURIComponent(slug)}?includeWords=true`);
}

/** One vocabulary entry by the slug its public page is addressed under. */
export function fetchWordBySlug<T>(level: string, slug: string): Promise<T | null> {
  return getJson<T>(
    `/words/by-slug/${encodeURIComponent(level.toLowerCase())}/${encodeURIComponent(slug)}`,
  );
}

/**
 * Every addressable word page. ~41k entries, so this is only ever called from
 * the sitemap, which regenerates daily — the API caches it for an hour on its
 * side too.
 */
export function fetchWordSlugs(): Promise<{ slug: string; level: string }[]> {
  return getJson<{ slug: string; level: string }[]>('/words/slug-index').then((data) =>
    Array.isArray(data) ? data : [],
  );
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Every topic, following pagination.
 *
 * `/topics` is paginated and defaults to 20 per page, so a single unqualified
 * request yields 20 of 198 — enough to look like it works while quietly leaving
 * 90% of the catalogue out of the sitemap. Asking for a big page and then
 * following `totalPages` means the set stays complete as the catalogue grows,
 * rather than silently truncating at whatever limit was hard-coded today.
 */
export async function fetchTopics(): Promise<SeoTopic[]> {
  const PAGE_SIZE = 200;
  const first = await getJson<Paginated<SeoTopic>>(`/topics?limit=${PAGE_SIZE}`);
  if (!first?.data) return [];

  const all = [...first.data];
  for (let page = 2; page <= (first.totalPages ?? 1); page++) {
    const next = await getJson<Paginated<SeoTopic>>(`/topics?limit=${PAGE_SIZE}&page=${page}`);
    if (!next?.data?.length) break;
    all.push(...next.data);
  }
  return all;
}

/** `/grammar/lessons` returns a plain array — no pagination to follow. */
export function fetchGrammarLessons(): Promise<SeoGrammarLesson[]> {
  return getJson<SeoGrammarLesson[]>('/grammar/lessons').then((data) =>
    Array.isArray(data) ? data : [],
  );
}

type Locale = 'vi' | 'en' | 'de';

/** Pick the field for a locale, falling back to Vietnamese — the source-of-truth copy. */
export function pickLocalised(
  locale: string,
  vi: string | null | undefined,
  en: string | null | undefined,
  de: string | null | undefined,
): string {
  const byLocale: Record<Locale, string | null | undefined> = { vi, en, de };
  return byLocale[locale as Locale] || vi || en || de || '';
}

/**
 * Canonical path for a locale, mirroring `localePrefix: 'as-needed'` — Vietnamese
 * is the default locale and carries no prefix.
 */
export function localisedPath(locale: string, path: string): string {
  return locale === 'vi' ? path : `/${locale}${path}`;
}
