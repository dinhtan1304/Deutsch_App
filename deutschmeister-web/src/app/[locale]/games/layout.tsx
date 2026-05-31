import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.pages.games' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: '/games',
    },
    alternates: { canonical: '/games' },
  };
}

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
