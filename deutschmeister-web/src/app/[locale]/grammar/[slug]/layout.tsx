import type { Metadata } from 'next';
import type { AppLocale } from '@/i18n/routing';
import { fetchGrammarLesson, pickLocalised, localisedPath } from '@/lib/seo/content';

/**
 * Per-lesson metadata.
 *
 * The page itself is a client component and so cannot export `generateMetadata`;
 * a server layout wrapping it can. Without this, all 32 lesson pages inherited
 * `/grammar/layout.tsx` and shipped the identical title with
 * `canonical: /grammar` — every one of them telling Google it was a duplicate
 * of the index, which is why none of the grammar library was indexable.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const lesson = await fetchGrammarLesson(slug);

  // The endpoint is public, but a slug can be stale or the API briefly down.
  // Self-canonicalise and let the page render rather than inheriting a wrong one.
  const canonical = localisedPath(locale, `/grammar/${slug}`);
  if (!lesson) return { alternates: { canonical } };

  const title = pickLocalised(locale, lesson.titleVi, lesson.titleEn, lesson.titleDe);
  const description =
    locale === 'en'
      ? `German grammar lesson ${lesson.lessonNumber} (${lesson.level}): ${title}. Clear explanations and practice exercises.`
      : locale === 'de'
        ? `Deutsche Grammatik, Lektion ${lesson.lessonNumber} (${lesson.level}): ${title}. Verständliche Erklärungen mit Übungen.`
        : `Bài ${lesson.lessonNumber} ngữ pháp tiếng Đức trình độ ${lesson.level}: ${title}. Giải thích bằng tiếng Việt kèm bài tập.`;

  return {
    title,
    description,
    openGraph: { title, description, url: canonical },
    alternates: {
      canonical,
      languages: {
        vi: `/grammar/${slug}`,
        en: `/en/grammar/${slug}`,
        de: `/de/grammar/${slug}`,
        'x-default': `/grammar/${slug}`,
      },
    },
  };
}

export default function GrammarLessonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
