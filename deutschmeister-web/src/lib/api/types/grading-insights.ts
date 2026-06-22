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
  /** Actionable fix: the rule to apply so the mistake stops recurring. */
  howToFixVi?: string;
  examples: Array<{ quote: string; errorId?: string }>;
}

export interface InsightStrength {
  category: WeaknessCategory;
  titleVi: string;
  evidence: string[];
}

/** "How to study next" tip: what to practise + a memorable rule + an example. */
export interface StudyTip {
  category: WeaknessCategory;
  titleVi: string;
  tipVi: string;
  exampleDe?: string;
}

export interface GradingInsights {
  weaknesses: InsightWeakness[];
  strengths: InsightStrength[];
  studyTips?: StudyTip[];
  overallSummaryVi: string;
}
