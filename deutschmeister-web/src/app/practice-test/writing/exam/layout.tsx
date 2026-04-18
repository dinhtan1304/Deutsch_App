'use client';

import { PremiumPaywall } from '@/components/subscription/PremiumPaywall';

export default function ExamWritingLayout({ children }: { children: React.ReactNode }) {
  return (
    <PremiumPaywall
      title="Đề chuẩn Writing"
      description="Luyện viết theo đề thi Goethe & TELC A1–B1 với Premium"
      featureContext="AI chấm bài Writing theo đề Goethe/TELC — giải thích từng lỗi bằng tiếng Việt và tiếng Đức. Chỉ dành cho Premium."
    >
      {children}
    </PremiumPaywall>
  );
}
