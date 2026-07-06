'use client';

import { useQuery } from '@tanstack/react-query';
import { examReadinessApi, ExamReadiness } from '@/lib/api/examReadiness';

export const examReadinessKeys = {
  all: ['exam-readiness'] as const,
  byExam: (examType: string, cefrLevel: string) =>
    [...examReadinessKeys.all, examType, cefrLevel] as const,
};

export function useExamReadiness(examType: string, cefrLevel: string, enabled = true) {
  return useQuery<ExamReadiness>({
    queryKey: examReadinessKeys.byExam(examType, cefrLevel),
    queryFn: () => examReadinessApi.get(examType, cefrLevel),
    staleTime: 60 * 1000,
    enabled: enabled && !!examType && !!cefrLevel,
  });
}
