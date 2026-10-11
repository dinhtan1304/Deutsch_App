'use client';
import { useTranslations } from 'next-intl';
import { Button, Card } from '@/components/ui';

export function LearningQueryState({
  error,
  retry,
}: {
  error: boolean;
  retry: () => void;
}) {
  const t = useTranslations('common.learning');
  return (
    <Card className="space-y-4" role={error ? 'alert' : 'status'}>
      <p>{t(error ? 'loadError' : 'loading')}</p>
      {error && (
        <Button variant="secondary" onClick={retry}>
          {t('retry')}
        </Button>
      )}
    </Card>
  );
}
