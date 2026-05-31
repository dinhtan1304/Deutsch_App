import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { RequireAuth } from '@/components/ui';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.pages.practiceTest' });
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(',').map((k) => k.trim()),
    alternates: { canonical: '/practice-test' },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: '/practice-test',
    },
  };
}

export default function PracticeTestLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
