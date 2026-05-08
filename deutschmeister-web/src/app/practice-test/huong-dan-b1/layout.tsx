import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cẩm nang luyện thi B1 Goethe & TELC — Cấu trúc đề, lộ trình, mẫu | DeutschMeister',
  description:
    'Hướng dẫn đầy đủ thi B1 tiếng Đức: cấu trúc đề Goethe-Zertifikat B1 & TELC Deutsch B1, lộ trình 12 tuần từ A2 lên B1, mẫu Schreiben, Redemittel Sprechen, Sprachbausteine, ngữ pháp & từ vựng B1 trọng tâm.',
  keywords: [
    'cẩm nang B1',
    'hướng dẫn thi B1',
    'thi B1 Goethe',
    'thi B1 TELC',
    'Goethe-Zertifikat B1',
    'TELC Deutsch B1',
    'cấu trúc đề B1',
    'Sprachbausteine TELC',
    'mẫu Schreiben B1',
    'Sprechen B1 Redemittel',
    'lộ trình học tiếng Đức B1',
    'ngữ pháp B1',
    'từ vựng B1 theo chủ đề',
  ],
  alternates: { canonical: '/practice-test/huong-dan-b1' },
  openGraph: {
    title: 'Cẩm nang luyện thi B1 Goethe & TELC — DeutschMeister',
    description:
      'Cấu trúc đề chi tiết, lộ trình 12 tuần, mẫu Schreiben, Redemittel Sprechen — tất cả ở 1 trang.',
    url: '/practice-test/huong-dan-b1',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cẩm nang luyện thi B1 Goethe & TELC',
    description: 'Cấu trúc đề, lộ trình 12 tuần, mẫu Schreiben & Sprechen.',
  },
};

export default function HuongDanB1Layout({ children }: { children: React.ReactNode }) {
  return children;
}
