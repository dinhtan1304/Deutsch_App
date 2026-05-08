import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luyện thi tiếng Đức Goethe & TELC — Đề chuẩn AI chấm | DeutschMeister',
  description:
    'Luyện 4 kỹ năng Lesen, Hören, Schreiben, Sprechen — đề chuẩn Goethe & TELC A1/A2/B1 với AI chấm bài chi tiết bằng tiếng Việt. Free practice + đề thi thử đầy đủ Teile.',
  keywords: [
    'luyện thi tiếng Đức',
    'luyện đề Goethe',
    'luyện đề TELC',
    'thi A1 A2 B1 tiếng Đức',
    'AI chấm Schreiben',
    'AI chấm Sprechen',
    'đề thi thử tiếng Đức',
  ],
  alternates: { canonical: '/practice-test' },
  openGraph: {
    title: 'Luyện thi Goethe & TELC A1/A2/B1 — Deutschmeister',
    description:
      'Đề thi chuẩn format 4 kỹ năng. AI chấm Schreiben/Sprechen và giải thích lỗi sai bằng tiếng Việt.',
    url: '/practice-test',
  },
};

export default function PracticeTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
