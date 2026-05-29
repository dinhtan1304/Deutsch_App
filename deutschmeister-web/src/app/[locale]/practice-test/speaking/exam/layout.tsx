'use client';

import { useTranslations } from 'next-intl';
import { PremiumPaywall } from '@/components/subscription/PremiumPaywall';

export default function ExamSpeakingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('practice.examSpeaking.paywall');
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
