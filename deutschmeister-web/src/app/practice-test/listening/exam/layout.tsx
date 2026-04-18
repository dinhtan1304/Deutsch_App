'use client';

import { PremiumPaywall } from '@/components/subscription/PremiumPaywall';

export default function ExamListeningLayout({ children }: { children: React.ReactNode }) {
  return (
    <PremiumPaywall
      title="Đề chuẩn Listening"
      description="Luyện nghe theo đề thi Goethe & TELC A1–B1 với Premium"
      featureContext="Thi thử Nghe có tính giờ chuẩn Goethe/TELC chỉ dành cho Premium — nâng cấp để luyện không giới hạn với countdown timer như thi thật."
    >
      {children}
    </PremiumPaywall>
  );
}
