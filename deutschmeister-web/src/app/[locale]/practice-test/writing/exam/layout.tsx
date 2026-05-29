'use client';

import { useTranslations } from 'next-intl';
import { PremiumPaywall } from '@/components/subscription/PremiumPaywall';

export default function ExamWritingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('practice.examWriting.paywall');
  return (
    <PremiumPaywall
      title={t('title')}
      description={t('description')}
      featureContext={t('featureContext')}
    >
      {children}
    </PremiumPaywall>
  );
}
