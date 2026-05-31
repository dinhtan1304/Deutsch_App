import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.pages.dictation' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: '/practice-test/dictation',
    },
    alternates: { canonical: '/practice-test/dictation' },
  };
}

export default function DictationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
