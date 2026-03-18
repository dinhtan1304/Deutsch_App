import { apiGet, apiPost } from './client';
import { GrammarLesson, GrammarLessonDetail, GrammarProgress, SubmitResult, GrammarStats } from '@/types/grammar';

export const grammarApi = {
  getLessons: async (level?: string): Promise<GrammarLesson[]> => {
    const query = level ? `?level=${level}` : '';
    return apiGet<GrammarLesson[]>(`/grammar/lessons${query}`);
  },

  getLessonBySlug: async (slug: string): Promise<GrammarLessonDetail> => {
    return apiGet<GrammarLessonDetail>(`/grammar/lessons/${slug}`);
  },

  getStats: async (): Promise<GrammarStats> => {
    return apiGet<GrammarStats>('/grammar/stats');
  },

  getUserProgress: async (): Promise<GrammarProgress[]> => {
    return apiGet<GrammarProgress[]>('/grammar/progress');
  },

  submitExercises: async (lessonId: string, answers: Record<number, string | string[]>): Promise<SubmitResult> => {
    return apiPost<SubmitResult>(`/grammar/lessons/${lessonId}/submit`, { answers });
  },
};
