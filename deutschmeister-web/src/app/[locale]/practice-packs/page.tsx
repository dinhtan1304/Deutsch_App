'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { Button, Card, RequireAuth } from '@/components/ui';
import { learningApi } from '@/lib/api/learning';
import { ACCENT } from '@/lib/tokens';

function PacksContent() {
  const t = useTranslations('common.learning');
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: learningApi.pack,
    onSuccess: (session) =>
      router.push(`/learning-session?session=${session.id}`),
  });
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-h1 font-semibold">{t('packsTitle')}</h1>
      <p style={{ color: 'var(--theme-text-muted)' }}>{t('packsIntro')}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {(['ausbildung', 'housing', 'work'] as const).map((id) => (
          <Card key={id} variant="bordered" className="flex flex-col gap-4">
            <h2 className="text-h3 font-semibold">{t(`packs.${id}.title`)}</h2>
            <p
              className="flex-1 text-body"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {t(`packs.${id}.intro`)}
            </p>
            <p className="text-caption">{t('packDuration')}</p>
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(id)}
            >
              {t('startPack')}
            </Button>
          </Card>
        ))}
      </div>
      {mutation.isError && <p role="alert">{t('loadError')}</p>}
      <Link href="/learning-session" style={{ color: ACCENT.brand }}>
        {t('back')}
      </Link>
    </main>
  );
}
export default function PracticePacksPage() {
  return (
    <RequireAuth>
      <PacksContent />
    </RequireAuth>
  );
}
