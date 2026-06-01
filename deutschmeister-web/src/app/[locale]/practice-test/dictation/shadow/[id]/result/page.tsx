'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useParams, useRouter } from 'next/navigation';
import { useShadowingSession, useStartShadowing } from '@/hooks/useShadowing';
import { PageHeader, ScoreRing } from '@/components/ui';
import { PhraseScoreBadge } from '@/components/shadowing/PhraseScoreBadge';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

type ScoreKey = 'excellent' | 'veryGood' | 'good' | 'needsWork' | 'keepPracticing';
function getScoreKey(score: number): ScoreKey {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'veryGood';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needsWork';
  return 'keepPracticing';
}

export default function ShadowingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.dictation.shadow.result');
  const { data: session, isLoading } = useShadowingSession(id);
  const startMut = useStartShadowing();
  const [filterWeak, setFilterWeak] = useState(false);

  const sortedAttempts = useMemo(() => {
    if (!session) return [];
    return [...session.attempts].sort((a, b) => {
      // Match attempt order to segment order
      const aIdx = session.segments.findIndex((s) => s.id === a.segmentId);
      const bIdx = session.segments.findIndex((s) => s.id === b.segmentId);
      return aIdx - bIdx;
    });
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="w-10 h-10 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          {t('notFound')}
        </p>
      </div>
    );
  }

  if (session.status !== 'SUBMITTED') {
    router.replace(`/practice-test/dictation/shadow/${id}`);
    return null;
  }

  const overall = session.overallScore ?? 0;
  const scoreKey = getScoreKey(overall);
  const meta = {
    label: t(`grades.${scoreKey}.label` as 'grades.excellent.label'),
    emoji: t(`grades.${scoreKey}.emoji` as 'grades.excellent.emoji'),
  };
  const visibleAttempts = filterWeak
    ? sortedAttempts.filter((a) => (a.pronunciationScore ?? 0) < 70)
    : sortedAttempts;
  const weakCount = sortedAttempts.filter((a) => (a.pronunciationScore ?? 0) < 70).length;

  const handleRetry = async () => {
    try {
      const newSession = await startMut.mutateAsync({ videoId: session.video.id });
      router.push(`/practice-test/dictation/shadow/${newSession.id}`);
    } catch {
      // toast handled upstream — fall back silently
    }
  };

  return (
    <div className="max-w-360 mx-auto px-4 py-8 pb-32">
      <PageHeader
        backHref="/practice-test/dictation/shadow"
        title={t('title')}
        subtitle={session.video.title}
        accent="reading"
      />

      {/* Hero score */}
      <div
        className="rounded-3xl border p-8 mb-8 flex flex-col md:flex-row items-center gap-8"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          boxShadow: '0 12px 32px rgba(34,197,94,0.08)',
        }}
      >
        <ScoreRing
          value={overall}
          variant="exam"
          accent="reading"
          size={170}
          strokeWidth={12}
          sublabel="/100"
        />
        <div className="flex-1 text-center md:text-left">
          <div
            className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {t('overallLabel')}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <span className="text-3xl">{meta.emoji}</span>
            <h2
              className="text-2xl font-black"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {meta.label}
            </h2>
          </div>
          <p
            className="text-sm opacity-70 mb-4"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {t('summary', { completed: session.completedSegments, total: session.totalSegments })}
          </p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              type="button"
              onClick={handleRetry}
              disabled={startMut.isPending}
              className="px-6 py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
              style={{ background: GRADIENT.reading }}
            >
              {startMut.isPending ? t('retryPending') : t('retry')}
            </button>
            <Link
              href="/practice-test/dictation/shadow"
              className="px-6 py-3 rounded-xl text-sm font-black border transition-all hover:bg-black/3 dark:hover:bg-white/5"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            >
              {t('backList')}
            </Link>
          </div>
        </div>
      </div>

      {/* Filter */}
      {weakCount > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span
            className="text-xs font-black uppercase tracking-widest opacity-50"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {t('filterLabel')}
          </span>
          <button
            type="button"
            onClick={() => setFilterWeak(false)}
            className="px-4 py-2 rounded-xl text-xs font-black transition-all border"
            style={
              !filterWeak
                ? {
                    background: GRADIENT.reading,
                    color: 'white',
                    borderColor: 'transparent',
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }
            }
          >
            {t('filterAll', { count: sortedAttempts.length })}
          </button>
          <button
            type="button"
            onClick={() => setFilterWeak(true)}
            className="px-4 py-2 rounded-xl text-xs font-black transition-all border"
            style={
              filterWeak
                ? {
                    backgroundColor: STATUS.warning,
                    color: 'white',
                    borderColor: 'transparent',
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }
            }
          >
            {t('filterWeak', { count: weakCount })}
          </button>
        </div>
      )}

      {/* Breakdown list */}
      <div className="space-y-3">
        {visibleAttempts.map((a) => {
          const score = a.pronunciationScore ?? 0;
          const segIdx = session.segments.findIndex((s) => s.id === a.segmentId);
          return (
            <div
              key={a.id}
              className="rounded-2xl border p-5"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                  style={{
                    backgroundColor: `${ACCENT.reading}15`,
                    color: ACCENT.reading,
                  }}
                >
                  {segIdx + 1}
                </span>
                <PhraseScoreBadge score={score} size="sm" />
                {a.attemptCount > 1 && (
                  <span
                    className="text-[10px] font-black uppercase tracking-widest opacity-50"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    {t('attemptTries', { count: a.attemptCount })}
                  </span>
                )}
              </div>
              <p
                className="text-base font-bold leading-relaxed mb-2"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {a.segmentText}
              </p>
              {a.userTranscript && (
                <div
                  className="p-3 rounded-xl text-sm italic mb-2"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-secondary)',
                  }}
                >
                  {t('youSaid', { text: a.userTranscript })}
                </div>
              )}
              {a.feedback && (
                <div
                  className="p-3 rounded-xl text-sm flex items-start gap-2"
                  style={{
                    backgroundColor: `${ACCENT.reading}0D`,
                    color: 'var(--theme-text-secondary)',
                    border: `1px solid ${ACCENT.reading}1A`,
                  }}
                >
                  <span className="shrink-0">💡</span>
                  <span>{a.feedback}</span>
                </div>
              )}
            </div>
          );
        })}

        {visibleAttempts.length === 0 && (
          <div
            className="text-center py-12 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <p
              className="text-sm opacity-70"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {t('noFiltered')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
