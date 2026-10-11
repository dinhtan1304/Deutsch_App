import type { Metadata } from 'next';
import type { AppLocale } from '@/i18n/routing';
import { fetchTopic, pickLocalised, localisedPath } from '@/lib/seo/content';

/**
 * Per-topic metadata.
 *
 * There was no layout anywhere between the root and these pages, so all 198 of
 * them inherited the root's `canonical: '/'` and the homepage title — each one
 * declaring itself a duplicate of the front page. Topic pages are the largest
 * body of indexable content the app has, and none of it could rank.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const topic = await fetchTopic(slug);

  const canonical = localisedPath(locale, `/topics/${slug}`);
  if (!topic) return { alternates: { canonical } };

  const name = pickLocalised(locale, topic.nameVi, topic.nameEn, topic.nameDe);
  const summary = pickLocalised(
    locale,
    topic.descriptionVi,
    topic.descriptionEn,
    topic.descriptionDe,
  );

  const title =
    locale === 'en'
      ? `${name} — German vocabulary (${topic.level})`
      : locale === 'de'
        ? `${name} — deutscher Wortschatz (${topic.level})`
        : `Từ vựng tiếng Đức chủ đề ${name} (${topic.level})`;

  // The topic's own description when it has one; otherwise something specific
  // enough to be worth a search result, built from what we do know.
  const description =
    summary ||
    (locale === 'en'
      ? `${topic.wordCount} German words on the topic of ${name}, at ${topic.level}, with articles, examples and audio.`
      : locale === 'de'
        ? `${topic.wordCount} deutsche Wörter zum Thema ${name} (${topic.level}) mit Artikeln, Beispielen und Audio.`
        : `${topic.wordCount} từ vựng tiếng Đức chủ đề ${name}, trình độ ${topic.level}, kèm giống từ, ví dụ và phát âm.`);

  return {
    title,
    description,
    openGraph: { title, description, url: canonical },
    alternates: {
      canonical,
      languages: {
        vi: `/topics/${slug}`,
        en: `/en/topics/${slug}`,
        de: `/de/topics/${slug}`,
        'x-default': `/topics/${slug}`,
      },
    },
  };
}

export default function TopicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
