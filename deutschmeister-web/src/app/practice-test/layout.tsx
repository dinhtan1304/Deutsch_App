import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luyện thi tiếng Đức',
  description: 'Luyện thi Goethe & TELC A1/A2/B1 với AI. Đề thi chuẩn format 4 kỹ năng: Nghe, Nói, Đọc, Viết. AI chấm bài chi tiết bằng tiếng Việt, giải thích lỗi sai.',
  openGraph: {
    title: 'Luyện thi Goethe & TELC A1/A2/B1 — Deutschmeister',
    description: 'Đề thi chuẩn format 4 kỹ năng Nghe-Nói-Đọc-Viết. AI chấm bài và giải thích lỗi sai bằng tiếng Việt.',
    url: '/practice-test',
  },
  alternates: { canonical: '/practice-test' },
};

export default function PracticeTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
