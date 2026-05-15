/**
 * Mirror of the BE shape at
 * deutschmeister-api/src/common/types/grading-insights.ts.
 *
 * Practice result pages render this to show the learner concrete weaknesses
 * (with quotes from their own work) and concrete strengths (with evidence),
 * beyond the existing score + general feedback.
 */

export type WeaknessCategory =
  | 'grammar'
  | 'vocabulary'
  | 'task'
  | 'coherence'
  | 'pronunciation'
  | 'skill'
  | 'comprehension';

export type WeaknessSeverity = 'error' | 'warning' | 'suggestion';

export interface InsightWeakness {
  category: WeaknessCategory;
  severity: WeaknessSeverity;
  titleVi: string;
  titleDe: string;
  explanationVi: string;
  examples: Array<{ quote: string; errorId?: string }>;
}

export interface InsightStrength {
  category: WeaknessCategory;
  titleVi: string;
  evidence: string[];
}

export interface GradingInsights {
  weaknesses: InsightWeakness[];
  strengths: InsightStrength[];
  overallSummaryVi: string;
}
