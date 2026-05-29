import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.pages.guideB1' });
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(',').map((k) => k.trim()),
    alternates: { canonical: '/practice-test/huong-dan-b1' },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: '/practice-test/huong-dan-b1',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
    },
  };
}

export default function HuongDanB1Layout({ children }: { children: React.ReactNode }) {
  return children;
}
