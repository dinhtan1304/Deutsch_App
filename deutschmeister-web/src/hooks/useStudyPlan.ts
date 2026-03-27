import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyPlanApi, CreateStudyPlanPayload } from '@/lib/api/studyPlan';

const KEY = ['study-plan'];

export function useStudyPlan() {
  return useQuery({
    queryKey: KEY,
    queryFn: studyPlanApi.getActive,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useStudyPlanWeek(weekNumber: number, enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'week', weekNumber],
    queryFn: () => studyPlanApi.getWeek(weekNumber),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStudyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudyPlanPayload) => studyPlanApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePauseStudyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studyPlanApi.pause,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useResumeStudyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studyPlanApi.resume,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteStudyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studyPlanApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
