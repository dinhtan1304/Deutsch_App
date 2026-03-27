import { apiGet, apiPost, apiPatch, apiDelete } from './client';

// ─── Types ───────────────────────────────────

export interface StudyPlan {
  id: string;
  userId: string;
  examFormat: string;
  targetLevel: string;
  examDate: string;
  startDate: string;
  totalWeeks: number;
  intensity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyTask {
  day: number;
  type: string;
  title: string;
  description: string;
  href: string;
  targetCount?: number;
}

export interface PhaseInfo {
  name: string;
  nameEn: string;
  focus: string;
  color: string;
  icon: string;
  weekStart: number;
  weekEnd: number;
}

export interface ActiveStudyPlan {
  plan: StudyPlan;
  currentWeek: number;
  currentPhase: PhaseInfo;
  phases: PhaseInfo[];
  overallProgress: number;
  daysUntilExam: number;
  todayTasks: WeeklyTask[];
  weekTasks: WeeklyTask[];
}

export interface WeekTasksResponse {
  weekNumber: number;
  phase: PhaseInfo;
  tasks: WeeklyTask[];
}

export interface CreateStudyPlanPayload {
  examFormat: string;
  targetLevel: string;
  examDate: string;
  intensity?: string;
}

// ─── API ─────────────────────────────────────

export const studyPlanApi = {
  create: (data: CreateStudyPlanPayload) =>
    apiPost<StudyPlan>('/study-plan', data),

  getActive: () =>
    apiGet<ActiveStudyPlan | null>('/study-plan'),

  getWeek: (week: number) =>
    apiGet<WeekTasksResponse>(`/study-plan/week/${week}`),

  pause: () =>
    apiPatch<StudyPlan>('/study-plan/pause'),

  resume: () =>
    apiPatch<StudyPlan>('/study-plan/resume'),

  remove: () =>
    apiDelete<void>('/study-plan'),
};
