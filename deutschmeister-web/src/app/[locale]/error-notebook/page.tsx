'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Card, Input, RequireAuth } from '@/components/ui';
import { useErrorNotebook, useReviewError } from '@/hooks/useLearning';
import { LearningQueryState } from '@/components/learning/LearningQueryState';
import { ErrorCard } from '@/lib/api/learning';
import { ACCENT, STATUS } from '@/lib/tokens';

function ErrorExercise({
  card,
  onNext,
}: {
  card: ErrorCard;
  onNext: () => void;
}) {
  const t = useTranslations('common.notebook');
  const locale = useLocale();
  const review = useReviewError();
  const [answer, setAnswer] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const fromGame = card.errorType.startsWith('game:');
  return (
    <Card variant="bordered" className="space-y-4">
      <p className="text-caption" style={{ color: ACCENT.writing }}>
        {card.errorType}
      </p>
      <h2 className="text-h3 font-semibold">{t('prompt')}</h2>
      <p className="text-lead" lang="de">
        {card.originalText}
      </p>
      {!result ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!answer.trim() || review.isPending) return;
            review.mutate(
              { id: card.id, answer, requestId },
              { onSuccess: (value) => setResult(value) },
            );
          }}
        >
          <Input
            label={t('answer')}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            autoComplete="off"
            lang="de"
            maxLength={5000}
          />
          <Button type="submit" disabled={!answer.trim() || review.isPending}>
            {t(review.isPending ? 'saving' : 'check')}
          </Button>
          {review.isError && <p role="alert">{t('reviewError')}</p>}
        </form>
      ) : (
        <div className="space-y-4" role="status">
          <p
            className="font-semibold"
            style={{ color: result.correct ? STATUS.success : STATUS.warning }}
          >
            {t(result.correct ? 'correct' : 'tryAgain')}
          </p>
          <p lang="de">{card.correctedText}</p>
          <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {locale === 'vi' ? card.explanationVi : card.explanationDe}
          </p>
          <Button onClick={onNext}>{t('next')}</Button>
        </div>
      )}
      <Link
        className="text-caption"
        href={fromGame ? '/games' : `/practice-test/writing/${card.sourceId}/result`}
        style={{ color: ACCENT.brand }}
      >
        {t(fromGame ? 'gamesSource' : 'source')}
      </Link>
    </Card>
  );
}
function NotebookContent() {
  const t = useTranslations('common.notebook');
  const [all, setAll] = useState(false);
  const [active, setActive] = useState<ErrorCard | null>(null);
  const query = useErrorNotebook(all);
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-h1 font-semibold">{t('title')}</h1>
      <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
        {t('intro')}
      </p>
      {!query.data ? (
        <LearningQueryState
          error={query.isError}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <p>
              {t('stats', { total: query.data.total, due: query.data.due })}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAll(!all);
                setActive(null);
              }}
            >
              {t(all ? 'showDue' : 'showAll')}
            </Button>
          </Card>
          {active ? (
            <ErrorExercise
              key={active.id}
              card={active}
              onNext={() => setActive(null)}
            />
          ) : query.data.cards.length ? (
            <div className="space-y-3">
              {query.data.cards.map((card) => (
                <Card key={card.id} className="space-y-3">
                  <p lang="de">{card.originalText}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className="text-caption"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {card.errorType}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={new Date(card.nextReviewAt) > new Date()}
                      onClick={() => setActive(card)}
                    >
                      {t(
                        new Date(card.nextReviewAt) > new Date()
                          ? 'scheduled'
                          : 'practice',
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="space-y-4">
              <p>{t(query.data.total ? 'nothingDue' : 'empty')}</p>
              <Link
                href="/practice-test/writing"
                style={{ color: ACCENT.brand }}
              >
                {t('write')}
              </Link>
            </Card>
          )}
        </>
      )}
      <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
        {t('exactMatch')}
      </p>
      <Link href="/learning-session" style={{ color: ACCENT.brand }}>
        {t('back')}
      </Link>
    </main>
  );
}
export default function ErrorNotebookPage() {
  return (
    <RequireAuth>
      <NotebookContent />
    </RequireAuth>
  );
}
