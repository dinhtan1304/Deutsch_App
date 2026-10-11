import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import type { Word } from '@/types';
import { fetchWordBySlug, localisedPath } from '@/lib/seo/content';
import { ACCENT, RADIUS } from '@/lib/tokens';

/**
 * A public page per vocabulary entry — 41,262 of them.
 *
 * This is the long-tail surface the site had none of. Somebody searching
 * "Mädchen nghĩa là gì" or "der die das Haus" is asking a question the database
 * has answered all along and no URL exposed.
 *
 * Server-rendered on purpose. A page whose only job is to be found must arrive
 * complete in the first response, and these are cheap to render: one indexed
 * lookup, no auth, no client state.
 *
 * They are not thin. Every entry carries a translation and at least one example
 * (96% have two or more), 99% carry a usage tip and 91% an IPA transcription —
 * measured, not assumed, before committing to publishing this many pages.
 */

export const revalidate = 86400;

/** Colour per grammatical gender — the same three the rest of the app uses. */
const GENDER_COLOR: Record<string, string> = {
  der: ACCENT.der,
  die: ACCENT.die,
  das: ACCENT.das,
};

function articleColor(article?: string | null): string {
  return GENDER_COLOR[(article ?? '').toLowerCase()] ?? ACCENT.brand;
}

/** "das Mädchen" for nouns, plain "gehen" for everything else. */
function fullForm(word: Word): string {
  return word.article ? `${word.article} ${word.word}` : word.word;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale; level: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, level, slug } = await params;
  const word = await fetchWordBySlug<Word>(level, slug);

  const canonical = localisedPath(locale, `/words/${level.toLowerCase()}/${slug}`);
  if (!word) return { alternates: { canonical }, robots: { index: false, follow: true } };

  const form = fullForm(word);
  const meaning = word.translationVi || word.translationEn;

  // Lead with the search phrasing rather than the brand: these pages are found
  // by people typing the question, not the product name.
  const title =
    locale === 'en'
      ? `${form} — meaning, article and examples`
      : locale === 'de'
        ? `${form} — Bedeutung, Artikel und Beispiele`
        : `${form} nghĩa là gì? Giống từ, ví dụ (${word.level})`;

  const description =
    locale === 'en'
      ? `${form} means "${word.translationEn}". Article, plural, pronunciation and example sentences at ${word.level}.`
      : locale === 'de'
        ? `${form}: Bedeutung, Artikel, Plural, Aussprache und Beispielsätze (${word.level}).`
        : `${form} nghĩa là "${meaning}". Giống từ, số nhiều, phát âm và câu ví dụ trình độ ${word.level}.`;

  return {
    title,
    description,
    openGraph: { title, description, url: canonical },
    alternates: {
      canonical,
      languages: {
        vi: `/words/${level.toLowerCase()}/${slug}`,
        en: `/en/words/${level.toLowerCase()}/${slug}`,
        de: `/de/words/${level.toLowerCase()}/${slug}`,
        'x-default': `/words/${level.toLowerCase()}/${slug}`,
      },
    },
  };
}

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ locale: AppLocale; level: string; slug: string }>;
}) {
  const { locale, level, slug } = await params;
  const word = await fetchWordBySlug<Word>(level, slug);
  if (!word) notFound();

  const vi = locale === 'vi';
  const color = articleColor(word.article);
  const meaning = word.translationVi || word.translationEn;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav aria-label="breadcrumb" style={{ fontSize: 12, marginBottom: 16 }}>
        <Link href="/words" style={{ color: 'var(--theme-text-muted)', textDecoration: 'none' }}>
          {vi ? 'Từ vựng' : 'Vocabulary'}
        </Link>
        <span style={{ color: 'var(--theme-border)', margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--theme-text-muted)' }}>{word.level}</span>
      </nav>

      <article>
        <header
          style={{
            borderRadius: RADIUS.lg,
            border: '1px solid var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            {word.article && (
              <span style={{ fontSize: 22, fontWeight: 700, color }}>{word.article}</span>
            )}
            <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--theme-text-primary)', margin: 0 }}>
              {word.word}
            </h1>
            <span
              style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: RADIUS.pill,
                backgroundColor: `${ACCENT.brand}1A`, color: ACCENT.brand,
              }}
            >
              {word.level}
            </span>
          </div>

          {word.pronunciation && (
            <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--theme-text-muted)' }}>
              /{word.pronunciation}/
            </p>
          )}

          <p style={{ margin: '14px 0 0', fontSize: 20, color: 'var(--theme-text-primary)' }}>
            {meaning}
          </p>
          {word.translationVi && word.translationEn && (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--theme-text-muted)' }}>
              {word.translationEn}
            </p>
          )}

          <dl style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '18px 0 0' }}>
            {word.plural && (
              <div>
                <dt style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>
                  {vi ? 'Số nhiều' : 'Plural'}
                </dt>
                <dd style={{ margin: 0, fontSize: 15, color: 'var(--theme-text-primary)' }}>
                  {word.plural}
                </dd>
              </div>
            )}
            {word.category && (
              <div>
                <dt style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>
                  {vi ? 'Chủ đề' : 'Category'}
                </dt>
                <dd style={{ margin: 0, fontSize: 15, color: 'var(--theme-text-primary)' }}>
                  {word.category}
                </dd>
              </div>
            )}
          </dl>
        </header>

        {word.examples?.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--theme-text-primary)' }}>
              {vi ? 'Câu ví dụ' : 'Example sentences'}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
              {word.examples.map((example, i) => (
                <li
                  key={i}
                  style={{
                    padding: '12px 14px',
                    marginBottom: 8,
                    borderRadius: RADIUS.md,
                    borderLeft: `3px solid ${color}`,
                    backgroundColor: 'var(--theme-bg-secondary)',
                    fontSize: 15,
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  {example}
                </li>
              ))}
            </ul>
          </section>
        )}

        {word.tips?.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--theme-text-primary)' }}>
              {vi ? 'Mẹo ghi nhớ' : 'Tips'}
            </h2>
            <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
              {word.tips.map((tip, i) => (
                <li key={i} style={{ fontSize: 14, color: 'var(--theme-text-secondary)', marginBottom: 6 }}>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div style={{ marginTop: 28 }}>
          <Link
            href="/words"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              borderRadius: RADIUS.sm,
              backgroundColor: ACCENT.brand,
              color: 'var(--accent-on)',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            {vi ? `Học thêm từ vựng ${word.level}` : `More ${word.level} vocabulary`}
          </Link>
        </div>
      </article>
    </div>
  );
}
