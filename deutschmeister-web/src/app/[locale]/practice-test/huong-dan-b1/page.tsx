import { getTranslations } from 'next-intl/server';
import { GuideContent } from './GuideContent';
import { faqList } from '../_data/b1-content';
import type { ExamTab } from '../_sections/ExamStructure';
import type { AppLocale } from '@/i18n/routing';

interface PageProps {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ exam?: string }>;
}

export default async function HuongDanB1Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { exam } = await searchParams;
  const initialTab: ExamTab = exam === 'telc' ? 'telc' : 'goethe';
  const t = await getTranslations({ locale, namespace: 'metadata.pages.guideB1' });

  return (
    <>
      <GuideContent initialTab={initialTab} />

      {/* JSON-LD: FAQPage + EducationalOccupationalProgram */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqList.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOccupationalProgram',
            name: t('jsonLdName'),
            description: t('jsonLdDescription'),
            provider: { '@type': 'Organization', name: 'DeutschMeister' },
            educationalCredentialAwarded: ['Goethe-Zertifikat B1', 'TELC Deutsch B1'],
            occupationalCategory: 'Language proficiency — German CEFR B1',
            educationalProgramMode: 'online',
            timeToComplete: 'P12W',
          }),
        }}
      />
    </>
  );
}
