import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bảng giá',
  description: 'Nâng cấp Premium để luyện thi Goethe & TELC không giới hạn. Chỉ từ 99,000đ/tháng — AI chấm bài, đề thi A1/A2/B1 chuẩn format. Lifetime deal giới hạn 500 suất.',
  openGraph: {
    title: 'Bảng giá — Deutschmeister',
    description: 'Nâng cấp Premium để luyện thi Goethe & TELC không giới hạn. Chỉ từ 99,000đ/tháng.',
    url: '/pricing',
  },
  alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
