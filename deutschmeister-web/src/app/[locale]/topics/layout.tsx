import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { localisedPath } from '@/lib/seo/content';

/**
 * Metadata for the topic index.
 *
 * It sits in the sitemap yet had no metadata of its own, so it inherited the
 * root layout's `canonical: '/'` and advertised itself as a copy of the
 * homepage. `[slug]` supplies its own and overrides this.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.pages.topics' });
  const tSite = await getTranslations({ locale, namespace: 'metadata' });
  const canonical = localisedPath(locale, '/topics');

  return {
    // Keep the brand template alive for the [slug] segment below: a plain
    // string here would overwrite the inherited { default, template }.
    title: { default: t('title'), template: `%s | ${tSite('siteName')}` },
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonical,
    },
    alternates: {
      canonical,
      languages: {
        vi: '/topics',
        en: '/en/topics',
        de: '/de/topics',
        'x-default': '/topics',
      },
    },
  };
}

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
