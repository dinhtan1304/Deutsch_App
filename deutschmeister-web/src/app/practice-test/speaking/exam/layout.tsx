'use client';

import { PremiumPaywall } from '@/components/subscription/PremiumPaywall';

export default function ExamSpeakingLayout({ children }: { children: React.ReactNode }) {
  return (
    <PremiumPaywall
      title="Đề chuẩn Speaking"
      description="Luyện nói theo đề thi Goethe & TELC A1–B1 với Premium"
      featureContext="AI chấm điểm phần thi nói theo tiêu chí Goethe/TELC — có timer chuẩn thi, transcript tự động. Chỉ dành cho Premium."
    >
      {children}
    </PremiumPaywall>
  );
}
