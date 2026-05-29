'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import Link from 'next/link';
import { useDueCards, useReviewCard, useProgressStats, useProgressIntervalPreview } from '@/hooks/useProgress';
import { getDelayText } from '@/lib/srs';
import { Progress, ReviewRating } from '@/types';

// Compact inline SRS review — 5 cards max, surfaced directly on the dashboard
// so the user never has to navigate elsewhere to clear their daily queue.
// The full review experience lives at /review; this widget is the 1-click entry.
const QUICK_LIMIT = 5;

// Color only; label resolved at render via dashboard.quickReview.rating.<rating>.
const RATING_BUTTONS: { rating: ReviewRating; color: string }[] = [
  { rating: 'again', color: STATUS.danger },
  { rating: 'hard', color: ACCENT.xp },
  { rating: 'good', color: STATUS.success },
  { rating: 'easy', color: ACCENT.srs },
];

export function QuickReviewWidget() {
  const t = useTranslations('dashboard.quickReview');
  const { data: stats } = useProgressStats();
  const { data: allDue = [], isLoading } = useDueCards(QUICK_LIMIT);
  const reviewMutation = useReviewCard();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionCards, setSessionCards] = useState<Progress[] | null>(null);

  // Lock the first 5 cards once the user starts rating so query invalidation
  // cannot shift the active list under the session.
  const cards = sessionCards ?? allDue.slice(0, QUICK_LIMIT);
  const current = cards[index];
  const { data: intervals } = useProgressIntervalPreview(current?.wordId);
  const dueTotal = stats?.due ?? 0;

  // Nothing due — hide the widget entirely. Don't render empty state; the
  // dashboard already has other content, don't waste vertical space.
  if (!isLoading && dueTotal === 0) return null;

  if (isLoading) {
    return (
      <div className="rounded-2xl border p-5 animate-pulse"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', height: 220 }}>
        <div className="h-4 w-32 rounded mb-3" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        <div className="h-24 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      </div>
    );
  }

  // Finished the 5-card session
  if (index >= cards.length) {
    const remaining = Math.max(0, dueTotal - completed);
    return (
      <div className="rounded-2xl border p-5"
        style={{
          borderColor: 'rgba(34,197,94,.25)',
          background: GRADIENT.readingBg,
        }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: GRADIENT.reading }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('doneTitle')}
            </h3>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {remaining > 0
                ? t('doneRemaining', { count: remaining })
                : t('doneCleared')}
            </p>
          </div>
        </div>
        {remaining > 0 && (
          <Link href="/review"
            className="block text-center text-body font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
            style={{
              background: GRADIENT.vocab,
              color: 'white',
              boxShadow: '0 4px 12px rgba(139,92,246,.3)',
            }}>
            {t('continueLink', { count: remaining })}
          </Link>
        )}
      </div>
    );
  }

  const handleRate = async (rating: ReviewRating) => {
    const activeCards = sessionCards ?? allDue.slice(0, QUICK_LIMIT);
    const activeCurrent = activeCards[index];
    if (!activeCurrent) return;
    if (!sessionCards) setSessionCards(activeCards);
    setError(null);
    try {
      await reviewMutation.mutateAsync({ wordId: activeCurrent.wordId, rating });
      setCompleted((c) => c + 1);
      setIndex((i) => i + 1);
      setRevealed(false);
    } catch {
      setError(t('saveError'));
    }
  };

  const progressPct = (index / cards.length) * 100;

  return (
    <div className="rounded-2xl border p-5"
      style={{
        borderColor: 'rgba(239,68,68,.25)',
        background: GRADIENT.warnDangerBg,
      }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={STATUS.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('title', { count: cards.length })}
            </h3>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {t('subtitle', { total: dueTotal })}
            </p>
          </div>
        </div>
        <Link href="/review" className="text-caption font-medium shrink-0"
          style={{ color: 'var(--theme-text-muted)' }}>
          {t('viewAll')}
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'rgba(148,163,184,.15)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: GRADIENT.dangerToXp,
          }} />
      </div>

      {/* Card */}
      {current && (
        <>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={revealed}
            className="w-full rounded-xl p-5 mb-3 text-center transition-all"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              border: '1.5px solid var(--theme-border)',
              cursor: revealed ? 'default' : 'pointer',
              minHeight: 120,
            }}>
            <div className="text-caption font-medium mb-1" style={{ color: 'var(--theme-text-muted)' }}>
              {index + 1} / {cards.length}
            </div>
            <div className="text-xl font-extrabold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              {current.word.article} {current.word.word}
            </div>
            {revealed ? (
              <div className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
                {current.word.translationVi || current.word.translationEn}
              </div>
            ) : (
              <div className="text-caption font-medium" style={{ color: ACCENT.writing }}>
                {t('tapToReveal')}
              </div>
            )}
          </button>

          {/* Rating buttons */}
          <div className="grid grid-cols-4 gap-2">
            {RATING_BUTTONS.map((btn) => (
              <button
                key={btn.rating}
                type="button"
                onClick={() => handleRate(btn.rating)}
                disabled={!revealed || reviewMutation.isPending}
                className="py-2 rounded-lg text-caption font-bold transition-all disabled:opacity-40"
                style={{
                  backgroundColor: revealed ? `${btn.color}18` : 'var(--theme-bg-secondary)',
                  color: revealed ? btn.color : 'var(--theme-text-muted)',
                  border: `1px solid ${revealed ? `${btn.color}40` : 'var(--theme-border)'}`,
                }}>
                <div>{t(`rating.${btn.rating}` as 'rating.again')}</div>
                <div className="text-[9px] font-normal opacity-70">
                  {intervals ? getDelayText(intervals[btn.rating].delayMinutes) : '...'}
                </div>
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-2 text-caption font-medium" style={{ color: STATUS.danger }}>
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
