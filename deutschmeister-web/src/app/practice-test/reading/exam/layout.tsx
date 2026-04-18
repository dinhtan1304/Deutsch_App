'use client';

import { PremiumPaywall } from '@/components/subscription/PremiumPaywall';

export default function ExamReadingLayout({ children }: { children: React.ReactNode }) {
  return (
    <PremiumPaywall
      title="Đề chuẩn Reading"
      description="Luyện theo đề thi Goethe & TELC A1–B1 với Premium"
      featureContext="Đề đọc hiểu chuẩn format Goethe/TELC với giải thích đáp án chi tiết — chỉ dành cho Premium."
    >
      {children}
    </PremiumPaywall>
  );
}
