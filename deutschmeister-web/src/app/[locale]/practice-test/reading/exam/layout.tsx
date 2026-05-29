'use client';

import { useTranslations } from 'next-intl';
import { PremiumPaywall } from '@/components/subscription/PremiumPaywall';

export default function ExamReadingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('practice.examReading.paywall');
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
