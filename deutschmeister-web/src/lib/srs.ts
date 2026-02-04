/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 * 
 * Calculates optimal review intervals based on recall quality
 */

export interface SRSCard {
  wordId: string;
  
  // SM-2 parameters
  repetitions: number;      // Number of consecutive correct reviews
  easeFactor: number;       // EF (2.5 default, min 1.3)
  interval: number;         // Days until next review
  
  // Dates
  nextReviewDate: string;   // ISO date string (YYYY-MM-DD)
  lastReviewDate: string | null;
  
  // Stats
  totalReviews: number;
  correctReviews: number;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Complete blackout
// 1 - Incorrect, recognized after seeing answer
// 2 - Incorrect, but seemed familiar  
// 3 - Correct with difficulty
// 4 - Correct with hesitation
// 5 - Perfect recall

/**
 * Create a new SRS card for a word
 */
export function createSRSCard(wordId: string): SRSCard {
  const today = new Date().toISOString().split('T')[0];
  return {
    wordId,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: today,
    lastReviewDate: null,
    totalReviews: 0,
    correctReviews: 0,
  };
}

/**
 * Calculate new SM-2 parameters after review
 */
export function calculateSM2(card: SRSCard, quality: ReviewQuality): SRSCard {
  const today = new Date().toISOString().split('T')[0];
  
  let { repetitions, easeFactor, interval } = card;
  
  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  if (quality < 3) {
    // Failed - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Success
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * newEaseFactor);
    }
    repetitions += 1;
  }
  
  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  
  return {
    ...card,
    repetitions,
    easeFactor: newEaseFactor,
    interval,
    nextReviewDate: nextDate.toISOString().split('T')[0],
    lastReviewDate: today,
    totalReviews: card.totalReviews + 1,
    correctReviews: card.correctReviews + (quality >= 3 ? 1 : 0),
  };
}

/**
 * Check if card is due for review
 */
export function isDueForReview(card: SRSCard): boolean {
  const today = new Date().toISOString().split('T')[0];
  return card.nextReviewDate <= today;
}

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
 * Get card status
 */
export function getCardStatus(card: SRSCard): 'new' | 'learning' | 'review' | 'mature' {
  if (card.repetitions === 0) return 'new';
  if (card.interval < 7) return 'learning';
  if (card.interval < 21) return 'review';
  return 'mature';
}

/**
 * Calculate preview intervals for each quality
 */
export function previewIntervals(card: SRSCard): { again: number; hard: number; good: number; easy: number } {
  return {
    again: 1, // quality < 3
    hard: calculateSM2(card, 3).interval,
    good: calculateSM2(card, 4).interval,
    easy: calculateSM2(card, 5).interval,
  };
}