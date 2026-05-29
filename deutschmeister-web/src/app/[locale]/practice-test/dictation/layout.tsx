import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chép chính tả tiếng Đức — Diktat',
  description:
    'Nghe video YouTube tiếng Đức và điền từ còn thiếu. Luyện nghe hiểu & chính tả theo cấp độ A1, A2, B1 với AI chấm tự động.',
  openGraph: {
    title: 'Chép chính tả tiếng Đức — Deutschmeister',
    description:
      'Diktat: Nghe video YouTube và điền từ còn thiếu. Hỗ trợ A1/A2/B1, AI chấm tự động.',
    url: '/practice-test/dictation',
  },
  alternates: { canonical: '/practice-test/dictation' },
};

export default function DictationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
