import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.pages.grammar' });

  const tSite = await getTranslations({ locale, namespace: 'metadata' });
  return {
    // Keep the brand template alive for the [slug] segment below: a plain
    // string here would overwrite the inherited { default, template }.
    title: { default: t('title'), template: `%s | ${tSite('siteName')}` },
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: '/grammar',
    },
    alternates: { canonical: '/grammar' },
  };
}

export default function GrammarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
