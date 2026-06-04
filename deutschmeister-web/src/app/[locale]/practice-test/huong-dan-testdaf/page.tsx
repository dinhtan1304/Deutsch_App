import type { Metadata } from 'next';
import { TestDafGuide } from './TestDafGuide';

export const metadata: Metadata = {
  title: 'Cẩm nang luyện thi TestDaF (B2–C1) | DeutschMeister',
  description:
    'Hướng dẫn thi TestDaF: cấu trúc 4 phần Đọc / Nghe / Viết / Nói, thang điểm TDN 3/4/5, lộ trình ôn B2→C1 và luyện đề mô phỏng có chấm điểm AI.',
  keywords: ['TestDaF', 'luyện thi TestDaF', 'TDN', 'tiếng Đức học thuật', 'du học Đức', 'B2', 'C1'],
};

export default function HuongDanTestDafPage() {
  return (
    <>
      <TestDafGuide />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOccupationalProgram',
            name: 'Luyện thi TestDaF (B2–C1) — DeutschMeister',
            description: 'Luyện 4 kỹ năng TestDaF với đề mô phỏng và chấm điểm AI theo thang TDN.',
            provider: { '@type': 'Organization', name: 'DeutschMeister' },
            educationalCredentialAwarded: 'TestDaF (TDN 3–5)',
            occupationalCategory: 'Language proficiency — German CEFR B2–C1',
            educationalProgramMode: 'online',
          }),
        }}
      />
    </>
  );
}
