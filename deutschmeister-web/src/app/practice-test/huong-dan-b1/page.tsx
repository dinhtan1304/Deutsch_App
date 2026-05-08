import { GuideContent } from './GuideContent';
import { faqList } from '../_data/b1-content';
import type { ExamTab } from '../_sections/ExamStructure';

interface PageProps {
  searchParams: Promise<{ exam?: string }>;
}

export default async function HuongDanB1Page({ searchParams }: PageProps) {
  const { exam } = await searchParams;
  const initialTab: ExamTab = exam === 'telc' ? 'telc' : 'goethe';

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
            name: 'Luyện thi B1 tiếng Đức (Goethe & TELC)',
            description:
              'Cẩm nang và đề thi thử B1 cho cả Goethe-Zertifikat B1 và TELC Deutsch B1: cấu trúc đề, lộ trình 12 tuần, AI chấm Schreiben/Sprechen, ngữ pháp & từ vựng trọng tâm.',
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
