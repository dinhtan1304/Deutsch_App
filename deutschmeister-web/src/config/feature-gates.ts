/**
 * Centralized feature gating: maps each gated feature to the minimum tier
 * required. Single source of truth — never read tier strings ad-hoc in pages
 * or components; go through these helpers.
 *
 * Tier hierarchy (least → most):
 *   free → premium_lite → premium / lifetime / exam_bundle
 *
 * "Exam access" tier collapses {premium, lifetime, exam_bundle} since all three
 * unlock the same exam-mode routes server-side.
 */

import type { PlanCode } from '@/lib/api/subscriptions';

export type FeatureGate = 'free' | 'paid' | 'exam';

/**
 * What it takes to use a feature beyond the free quota:
 * - 'free' — accessible to everyone (no gate)
 * - 'paid' — needs any paid plan (premium_lite OR premium OR lifetime OR exam_bundle)
 * - 'exam' — needs exam-access plan (premium OR lifetime OR exam_bundle, NOT premium_lite)
 */
export const FEATURE_GATES: Record<string, FeatureGate> = {
  // ─── Free forever (no gate at all) ───────────────────────────────────────
  vocabulary: 'free',
  dictionary: 'free',
  topics: 'free',
  games: 'free',
  srs: 'free',
  dashboard: 'free',
  achievements: 'free',
  challenges: 'free',
  leaderboard: 'free',
  studyPlanTemplate: 'free',
  communityTopics: 'free',
  grammarA1A2: 'free',

  // ─── Quota-based (any paid plan removes the quota) ──────────────────────
  writingAi: 'paid',
  speakingAi: 'paid',
  readingAi: 'paid',
  listeningAi: 'paid',
  roleplayAi: 'paid',
  pronunciationAi: 'paid',
  shadowingAi: 'paid',
  speakingRooms: 'paid',
  grammarAnalyzeAi: 'paid',
  grammarB1B2: 'paid',

  // ─── Exam-only (Premium Lite does NOT unlock) ───────────────────────────
  examReading: 'exam',
  examWriting: 'exam',
  examListening: 'exam',
  examSpeaking: 'exam',
  examAnalytics: 'exam',
  mockExam: 'exam',
  aiPartnerVoice: 'exam',
  customStudyPlanAi: 'exam',
};

/**
 * Resolve whether the user's current plan unlocks the given feature.
 * Pure function — no React hooks. Use from anywhere.
 */
export function canAccessFeature(plan: PlanCode | undefined, feature: string): boolean {
  const gate = FEATURE_GATES[feature] ?? 'free';
  if (gate === 'free') return true;

  const isPaid = plan === 'premium_lite' || plan === 'premium' || plan === 'lifetime' || plan === 'exam_bundle';
  const hasExam = plan === 'premium' || plan === 'lifetime' || plan === 'exam_bundle';

  if (gate === 'paid') return isPaid;
  if (gate === 'exam') return hasExam;
  return false;
}

/**
 * Returns the minimum tier label needed to unlock this feature. Used in
 * paywall UIs to explain "this is locked because you need X".
 */
export function requiredTierLabel(feature: string): { tier: FeatureGate; vi: string } {
  const gate = FEATURE_GATES[feature] ?? 'free';
  switch (gate) {
    case 'free': return { tier: 'free', vi: 'Miễn phí' };
    case 'paid': return { tier: 'paid', vi: 'Premium Lite trở lên' };
    case 'exam': return { tier: 'exam', vi: 'Premium / Exam Bundle' };
  }
}
