'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { STATUS } from '@/lib/tokens';
import Link from 'next/link';
import { useDueCards, useReviewCard, useProgressStats, useProgressIntervalPreview } from '@/hooks/useProgress';
import { getDelayText } from '@/lib/srs';
import { IconFlame, IconCheck } from '@/components/ui/Icons';
import { Progress, ReviewRating } from '@/types';

// Compact inline SRS review — 5 cards max, surfaced directly on the dashboard.
// Full review lives at /review; this widget is the 1-click entry.
const QUICK_LIMIT = 5;

// v2 "Ôn nhanh" rating colors (match dashboard.js) via CSS vars.
const RATING_BUTTONS: { rating: ReviewRating; color: string }[] = [
  { rating: 'again', color: 'var(--v2-danger)' },
  { rating: 'hard', color: 'var(--v2-warn)' },
  { rating: 'good', color: 'var(--v2-violet)' },
  { rating: 'easy', color: 'var(--v2-success)' },
];

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-4.5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      {children}
    </section>
  );
}

// Subtle entry-point to the full adaptive Smart Review hub.
function SmartReviewLink({ label }: { label: string }) {
  return (
    <Link
      href="/smart-review"
      className="mt-3 flex items-center justify-center gap-1 text-caption font-semibold transition-opacity hover:opacity-80"
      style={{ color: 'var(--accent)' }}
    >
      {label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
    </Link>
  );
}

export function QuickReviewWidget() {
  const t = useTranslations('dashboard.quickReview');
  const tn = useTranslations('nav');
  const { data: stats } = useProgressStats();
  const { data: allDue = [], isLoading } = useDueCards(QUICK_LIMIT);
  const reviewMutation = useReviewCard();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionCards, setSessionCards] = useState<Progress[] | null>(null);

  const cards = sessionCards ?? allDue.slice(0, QUICK_LIMIT);
  const current = cards[index];
  const { data: intervals } = useProgressIntervalPreview(current?.wordId);
  const dueTotal = stats?.due ?? 0;

  if (!isLoading && dueTotal === 0) return null;

  if (isLoading) {
    return (
      <CardShell>
        <div className="animate-pulse">
          <div className="h-4 w-28 rounded mb-3" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="h-40 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        </div>
      </CardShell>
    );
  }

  // Finished the 5-card session
  if (index >= cards.length) {
    const remaining = Math.max(0, dueTotal - completed);
    return (
      <CardShell>
        <div className="flex items-center gap-3 mb-2">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--m-learned) 16%, transparent)', color: 'var(--m-learned)' }}>
            <IconCheck size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('doneTitle')}</h3>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {remaining > 0 ? t('doneRemaining', { count: remaining }) : t('doneCleared')}
            </p>
          </div>
        </div>
        {remaining > 0 && (
          <Link href="/review" className="block text-center text-body font-bold px-4 py-2.5 rounded-xl transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
            {t('continueLink', { count: remaining })}
          </Link>
        )}
        <SmartReviewLink label={tn('smartReview')} />
      </CardShell>
    );
  }

  if (!current) return null;

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

  return (
    <CardShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-5.5 h-5.5 rounded-md inline-flex items-center justify-center" style={{ background: 'var(--streak-soft)', color: 'var(--streak)' }}>
            <IconFlame size={12} />
          </span>
          <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t('title', { count: cards.length })}</span>
        </div>
        <span className="mono text-caption" style={{ color: 'var(--theme-text-muted)' }}>{index + 1} / {cards.length}</span>
      </div>

      {/* Flip card */}
      <button
        type="button"
        onClick={() => !revealed && setRevealed(true)}
        className="v2-flip-card w-full rounded-xl px-4.5 py-6 mb-3 flex flex-col items-center justify-center gap-1.5 text-center"
        style={{
          minHeight: 160,
          border: '1px solid var(--theme-border)',
          cursor: revealed ? 'default' : 'pointer',
        }}
      >
        {!revealed ? (
          <>
            <span className="text-[10.5px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>Deutsch</span>
            <h4 className="font-bold" style={{ fontSize: 26, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
              {current.word.article} {current.word.word}
            </h4>
            {current.word.pronunciation && <span className="mono text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>/{current.word.pronunciation}/</span>}
            <span className="text-[11.5px] mt-1.5" style={{ color: 'var(--theme-text-secondary)' }}>{t('tapToReveal')}</span>
          </>
        ) : (
          <>
            <span className="text-[10.5px] font-semibold uppercase" style={{ color: 'var(--accent)', letterSpacing: '.08em' }}>{t('meaningLabel')}</span>
            <h4 className="font-bold" style={{ fontSize: 20, letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>
              {current.word.translationVi || current.word.translationEn}
            </h4>
            {current.word.examples?.[0] && <span className="text-[12.5px] italic" style={{ color: 'var(--theme-text-secondary)' }}>&bdquo;{current.word.examples[0]}&ldquo;</span>}
            {current.word.translationEn && current.word.translationVi && (
              <span className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>EN: {current.word.translationEn}</span>
            )}
          </>
        )}
      </button>

      {/* Rating buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {RATING_BUTTONS.map((btn) => (
          <button
            key={btn.rating}
            type="button"
            onClick={() => handleRate(btn.rating)}
            disabled={!revealed || reviewMutation.isPending}
            className="py-2 px-1 rounded-[9px] flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40"
            style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
            onMouseEnter={(e) => { if (revealed) { e.currentTarget.style.background = `color-mix(in srgb, ${btn.color} 18%, transparent)`; e.currentTarget.style.borderColor = `color-mix(in srgb, ${btn.color} 55%, transparent)`; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--theme-bg-secondary)'; e.currentTarget.style.borderColor = 'var(--theme-border)'; }}
          >
            <span className="text-caption font-semibold" style={{ color: revealed ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)' }}>{t(`rating.${btn.rating}` as 'rating.again')}</span>
            <span className="mono text-[9.5px]" style={{ color: 'var(--theme-text-muted)' }}>{intervals ? getDelayText(intervals[btn.rating].delayMinutes) : '…'}</span>
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-caption font-medium" style={{ color: STATUS.danger }}>{error}</p>}
      <SmartReviewLink label={tn('smartReview')} />
    </CardShell>
  );
}
