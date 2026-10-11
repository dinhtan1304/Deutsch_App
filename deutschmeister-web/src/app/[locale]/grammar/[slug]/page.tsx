import type { GrammarLessonDetail } from '@/types/grammar';
import { fetchGrammarLessonDetail } from '@/lib/seo/content';
import { LessonView } from './_components/LessonView';

/**
 * Server shell for a grammar lesson.
 *
 * The page was a client component that fetched its lesson after hydration, so
 * the HTML a crawler received was 255KB of bundle around an empty skeleton —
 * `bin`, `bist` and `ist` appeared nowhere in the markup for the lesson about
 * conjugating *sein*. Googlebot does run JavaScript, but it defers that pass and
 * gives no guarantee about it, which is a poor bet for the pages the whole SEO
 * effort rests on.
 *
 * Fetching here and handing the result down as `initialData` puts the theory in
 * the first response while leaving the interactive lesson exactly as it was.
 */
export default async function GrammarLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Null on a miss or an API blip; the client query then fetches as before.
  const lesson = await fetchGrammarLessonDetail<GrammarLessonDetail>(slug);

  return <LessonView initialLesson={lesson ?? undefined} />;
}
