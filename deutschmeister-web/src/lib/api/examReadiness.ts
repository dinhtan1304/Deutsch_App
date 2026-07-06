import { apiGet } from './client';

// ─── Types (mirror src/modules/exam-readiness on the API) ────────────────────

export type ReadinessSkill = 'reading' | 'listening' | 'writing' | 'speaking';

export interface SkillReadiness {
  skill: ReadinessSkill;
  attempts: number;
  recentAvg: number | null;
  best: number | null;
  trend: number | null;
  pass: boolean;
}

export interface TeilAccuracy {
  skill: ReadinessSkill;
  teil: number;
  attempts: number;
  accuracy: number;
}

export interface ReadinessRecommendation {
  skill: ReadinessSkill;
  teil: number;
  accuracy: number;
  href: string;
}

export interface ExamReadiness {
  examType: string;
  cefrLevel: string;
  passThreshold: number;
  readinessScore: number;
  skills: SkillReadiness[];
  teils: TeilAccuracy[];
  recommendations: ReadinessRecommendation[];
  studyPlan: {
    examDate: string | null;
    targetLevel: string;
    examFormat: string;
    daysLeft: number | null;
  } | null;
}

export const examReadinessApi = {
  get: (examType: string, cefrLevel: string) =>
    apiGet<ExamReadiness>(`/exam-readiness?examType=${examType}&cefrLevel=${cefrLevel}`),
};
