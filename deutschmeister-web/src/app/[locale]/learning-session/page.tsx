'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Card, RequireAuth } from '@/components/ui';
import {
  useLearningSession,
  useCompleteLearningStep,
} from '@/hooks/useLearning';
import { LearningQueryState } from '@/components/learning/LearningQueryState';
import { ACCENT } from '@/lib/tokens';

function SessionContent() {
  const t = useTranslations('common.learning');
  const searchParams = useSearchParams();
  const query = useLearningSession(searchParams.get('session') ?? undefined);
  const complete = useCompleteLearningStep();
  const session = query.data;
  if (!session)
    return (
      <LearningQueryState
        error={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const finished = session.steps.every((step) =>
    session.completed.includes(step.id),
  );
  const packId = session.sessionKey.startsWith('pack:')
    ? session.sessionKey.slice(5)
    : null;
  const current = session.steps.find(
    (step) => !session.completed.includes(step.id),
  );
  const totalMinutes = session.steps.reduce(
    (sum, step) => sum + step.minutes,
    0,
  );
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-caption" style={{ color: ACCENT.brand }}>
          {t('badge', { minutes: totalMinutes })}
        </p>
        <h1 className="text-h1 font-semibold">
          {packId
            ? t(`packs.${packId as 'ausbildung' | 'housing' | 'work'}.title`)
            : t('title')}
        </h1>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          {t('intro')}
        </p>
      </header>
      <Card className="space-y-3">
        <p className="text-body font-semibold" role="status">
          {t(finished ? 'finished' : 'progress', {
            done: session.completed.length,
            total: session.steps.length,
          })}
        </p>
        <progress
          className="w-full"
          aria-label={t('progressLabel')}
          value={session.completed.length}
          max={session.steps.length}
          style={{ accentColor: ACCENT.brand }}
        />
        <p
          className="text-caption"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('saved')}
        </p>
      </Card>
      {session.steps.map((step, index) => {
        const done = session.completed.includes(step.id);
        const title = packId
          ? t(`packSteps.${step.id as 'vocabulary' | 'speaking' | 'writing'}`)
          : t(
              `kinds.${step.kind as 'srs' | 'remediation' | 'skill' | 'explore'}`,
            );
        return (
          <Card key={step.id} variant="bordered" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-h3 font-semibold">
                {index + 1}. {title}
              </h2>
              <span className="text-caption">
                {t('minutes', { count: step.minutes })}
              </span>
            </div>
            {step.count && (
              <p className="text-body">{t('target', { count: step.count })}</p>
            )}
            {packId && (
              <p
                className="text-body"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                {t(
                  `packs.${packId as 'ausbildung' | 'housing' | 'work'}.${step.id as 'vocabulary' | 'speaking' | 'writing'}`,
                )}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={step.href}
                className="text-body font-semibold"
                style={{ color: ACCENT.brand }}
              >
                {t(done ? 'again' : current?.id === step.id ? 'start' : 'open')}
              </Link>
              <Button
                variant="secondary"
                size="sm"
                disabled={done || complete.isPending}
                onClick={() =>
                  complete.mutate({ id: session.id, stepId: step.id })
                }
              >
                {t(done ? 'done' : 'markComplete')}
              </Button>
            </div>
          </Card>
        );
      })}
      {complete.isError && <p role="alert">{t('saveError')}</p>}
      <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
        {t('checklistNote')}
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/error-notebook" style={{ color: ACCENT.brand }}>
          {t('notebookLink')}
        </Link>
        <Link href="/practice-packs" style={{ color: ACCENT.brand }}>
          {t('packsLink')}
        </Link>
        <Link href="/smart-review" style={{ color: ACCENT.brand }}>
          {t('fullPlan')}
        </Link>
      </div>
    </main>
  );
}
export default function LearningSessionPage() {
  return (
    <RequireAuth>
      <Suspense>
        <SessionContent />
      </Suspense>
    </RequireAuth>
  );
}
