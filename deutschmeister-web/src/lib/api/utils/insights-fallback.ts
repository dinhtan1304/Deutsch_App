import type {
  GradingInsights,
  InsightWeakness,
  InsightStrength,
} from '../types/grading-insights';

/**
 * Return the session's structured insights if the BE produced them; otherwise
 * synthesize a minimal stand-in from the legacy strengths/improvements/
 * feedback fields so old rows (pre-Phase A deploy) still render a sensible
 * panel instead of empty space.
 *
 * The synthesized output is intentionally bare-bones — same shape, no
 * examples or evidence — so it's visually clear (and the caller can
 * choose to label it differently) that this is a degraded view.
 */
export function coalesceInsights(input: {
  insights?: GradingInsights | null;
  strengths?: unknown;
  improvements?: unknown;
  feedbackVi?: string | null;
  generalFeedbackVi?: string | null;
}): GradingInsights | null {
  if (input.insights && Array.isArray(input.insights.weaknesses)) {
    return input.insights;
  }

  const improvements = toStringArray(input.improvements);
  const strengths = toStringArray(input.strengths);
  if (improvements.length === 0 && strengths.length === 0) {
    return null;
  }

  const weaknesses: InsightWeakness[] = improvements.map((item) => ({
    category: 'grammar',
    severity: 'warning',
    titleVi: item,
    titleDe: '',
    explanationVi: '',
    examples: [],
  }));

  const synthStrengths: InsightStrength[] = strengths.map((item) => ({
    category: 'grammar',
    titleVi: item,
    evidence: [],
  }));

  return {
    weaknesses,
    strengths: synthStrengths,
    overallSummaryVi: input.feedbackVi || input.generalFeedbackVi || '',
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}
