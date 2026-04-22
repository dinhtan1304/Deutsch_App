/**
 * SRS Utility Functions
 * 
 * SM-2 calculation is handled by the backend.
 * This file provides display utilities for the frontend.
 */

import { Progress } from '@/types';

/**
 * Get interval text in Vietnamese.
 * Intervals < 1 are treated as fractional days (e.g. 10/1440 ≈ 10 minutes).
 */
export function getIntervalText(interval: number): string {
  if (interval <= 0) return '< 10 phút';
  if (interval < 1) {
    const mins = Math.round(interval * 1440);
    if (mins < 60) return `${mins} phút`;
    return `${Math.round(mins / 60)} giờ`;
  }
  if (interval === 1) return '1 ngày';
  if (interval < 7) return `${interval} ngày`;
  if (interval < 30) return `${Math.round(interval / 7)} tuần`;
  if (interval < 365) return `${Math.round(interval / 30)} tháng`;
  return `${Math.round(interval / 365)} năm`;
}

/**
 * Get card status based on progress data
 */
export function getCardStatus(card: Progress): 'new' | 'learning' | 'review' | 'mature' {
  if (card.repetitions === 0) return 'new';
  if (card.interval < 7) return 'learning';
  if (card.interval < 21) return 'review';
  return 'mature';
}

const AGAIN_MINUTES = 10; // relearn interval in minutes

/**
 * Preview estimated intervals for each rating (client-side approximation).
 * Actual calculation is done by the backend; this is display-only.
 *
 * Intervals < 1 represent fractional days (e.g. 10/1440 ≈ 10 minutes).
 */
export function previewIntervals(card: Progress): {
  again: number;
  hard: number;
  good: number;
  easy: number;
} {
  const ef = Math.max(1.3, card.easeFactor ?? 2.5);
  const rep = card.repetitions ?? 0;
  const ivl = card.interval ?? 1;

  // again always restarts learning (< 10 min)
  const again = AGAIN_MINUTES / 1440;

  if (rep <= 1) {
    // New / learning card
    return { again, hard: 1, good: 3, easy: 7 };
  }

  // Established card — interval × multiplier
  const hard = Math.max(1, Math.round(ivl * 1.2));
  const good = Math.max(3, Math.round(ivl * 2.5));
  const easy = Math.max(7, Math.round(ivl * 4));

  return { again, hard, good, easy };
}
