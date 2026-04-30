'use client';
/* eslint-disable no-restricted-syntax */

import { useState, useMemo } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import Link from 'next/link';
import { useDueCards, useReviewCard, useProgressStats } from '@/hooks/useProgress';
import { ReviewRating } from '@/types';

// Compact inline SRS review — 5 cards max, surfaced directly on the dashboard
// so the user never has to navigate elsewhere to clear their daily queue.
// The full review experience lives at /review; this widget is the 1-click entry.
const QUICK_LIMIT = 5;

const RATING_BUTTONS: { rating: ReviewRating; label: string; color: string; hint: string }[] = [
  { rating: 'again', label: 'Quên', color: STATUS.danger, hint: '<1m' },
  { rating: 'hard', label: 'Khó', color: ACCENT.xp, hint: '~6m' },
  { rating: 'good', label: 'Được', color: STATUS.success, hint: '+1d' },
  { rating: 'easy', label: 'Dễ', color: ACCENT.srs, hint: '+4d' },
];

export function QuickReviewWidget() {
  const { data: stats } = useProgressStats();
  const { data: allDue = [], isLoading } = useDueCards(QUICK_LIMIT);
  const reviewMutation = useReviewCard();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(0);

  // Snapshot the first 5 due cards so rating one doesn't shift the list
  // under the user (useDueCards re-runs after each mutation).
  const cards = useMemo(() => allDue.slice(0, QUICK_LIMIT), [allDue]);
  const current = cards[index];
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
          background: 'linear-gradient(135deg, rgba(34,197,94,.08), rgba(20,184,166,.04))',
        }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Ôn nhanh xong!
            </h3>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {remaining > 0
                ? `Còn ${remaining} từ chờ ôn — tiếp tục để giữ đà`
                : 'Đã ôn hết hôm nay. Hẹn ngày mai!'}
            </p>
          </div>
        </div>
        {remaining > 0 && (
          <Link href="/review"
            className="block text-center text-body font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139,92,246,.3)',
            }}>
            Ôn tiếp {remaining} từ →
          </Link>
        )}
      </div>
    );
  }

  const handleRate = (rating: ReviewRating) => {
    if (!current) return;
    // Fire-and-forget: let the mutation run in the background while we
    // advance the UI. The SRS queue just needs the rating logged; the
    // user doesn't need to wait for the server round-trip.
    reviewMutation.mutate({ wordId: current.wordId, rating });
    setCompleted((c) => c + 1);
    setIndex((i) => i + 1);
    setRevealed(false);
  };

  const progressPct = (index / cards.length) * 100;

  return (
    <div className="rounded-2xl border p-5"
      style={{
        borderColor: 'rgba(239,68,68,.25)',
        background: 'linear-gradient(135deg, rgba(239,68,68,.05), rgba(245,158,11,.03))',
      }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Ôn nhanh {cards.length} từ
            </h3>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              Tổng {dueTotal} từ chờ ôn — bấm 1 lần là xong
            </p>
          </div>
        </div>
        <Link href="/review" className="text-caption font-medium shrink-0"
          style={{ color: 'var(--theme-text-muted)' }}>
          Xem tất cả →
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'rgba(148,163,184,.15)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #EF4444, #F59E0B)',
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
                Nhấn để xem nghĩa
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
                disabled={!revealed}
                className="py-2 rounded-lg text-caption font-bold transition-all disabled:opacity-40"
                style={{
                  backgroundColor: revealed ? `${btn.color}18` : 'var(--theme-bg-secondary)',
                  color: revealed ? btn.color : 'var(--theme-text-muted)',
                  border: `1px solid ${revealed ? `${btn.color}40` : 'var(--theme-border)'}`,
                }}>
                <div>{btn.label}</div>
                <div className="text-[9px] font-normal opacity-70">{btn.hint}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
