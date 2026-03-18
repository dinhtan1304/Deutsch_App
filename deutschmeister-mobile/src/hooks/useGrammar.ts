import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { grammarApi } from '@/lib/api/grammar';

// ============================================
// Query Keys
// ============================================
export const grammarKeys = {
  all: ['grammar'] as const,
  lessons: (level?: string) => [...grammarKeys.all, 'lessons', level] as const,
  lesson: (slug: string) => [...grammarKeys.all, 'lesson', slug] as const,
  stats: () => [...grammarKeys.all, 'stats'] as const,
  progress: () => [...grammarKeys.all, 'progress'] as const,
};

// ============================================
// Hooks
// ============================================

/** Lấy danh sách grammar lessons */
export function useGrammarLessons(level?: string) {
  return useQuery({
    queryKey: grammarKeys.lessons(level),
    queryFn: () => grammarApi.getLessons(level),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Lấy chi tiết 1 lesson theo slug */
export function useGrammarLesson(slug: string) {
  return useQuery({
    queryKey: grammarKeys.lesson(slug),
    queryFn: () => grammarApi.getLessonBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/** Lấy grammar stats */
export function useGrammarStats() {
  return useQuery({
    queryKey: grammarKeys.stats(),
    queryFn: () => grammarApi.getStats(),
    staleTime: 10 * 60 * 1000,
  });
}

/** Lấy user grammar progress */
export function useGrammarProgress() {
  return useQuery({
    queryKey: grammarKeys.progress(),
    queryFn: () => grammarApi.getUserProgress(),
    staleTime: 2 * 60 * 1000,
  });
}

/** Submit bài tập grammar */
export function useSubmitGrammarExercises() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, answers }: { lessonId: string; answers: Record<number, string | string[]> }) =>
      grammarApi.submitExercises(lessonId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grammarKeys.progress() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
