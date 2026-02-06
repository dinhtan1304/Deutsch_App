/**
 * SRS Utility Functions
 * 
 * SM-2 calculation is handled by the backend.
 * This file provides display utilities for the frontend.
 */

import { Progress } from '@/types';

/**
 * Get interval text in Vietnamese
 */
export function getIntervalText(interval: number): string {
  if (interval === 0) return 'Hôm nay';
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

/**
 * Preview estimated intervals for each rating (client-side approximation).
 * Uses the standard SM-2 formula for display purposes only — 
 * actual calculation is done by the backend.
 */
export function previewIntervals(card: Progress): {
  again: number;
  hard: number;
  good: number;
  easy: number;
} {
  const { easeFactor, interval, repetitions } = card;

  const estimate = (quality: number): number => {
    if (quality < 3) return 1;

    const newEF = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    if (repetitions === 0) return 1;
    if (repetitions === 1) return 6;
    return Math.round(interval * newEF);
  };

  return {
    again: 1,
    hard: estimate(3),
    good: estimate(4),
    easy: estimate(5),
  };
}
