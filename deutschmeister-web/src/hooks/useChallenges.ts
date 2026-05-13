import { useQuery } from '@tanstack/react-query';
import {
  getWeeklyChallenges,
  getChallengeHistory,
  getDailyMissions,
  getDailyMissionHistory,
} from '@/lib/api/challenges';

export function useWeeklyChallenges() {
  return useQuery({
    queryKey: ['challenges', 'weekly'],
    queryFn: getWeeklyChallenges,
    staleTime: 60_000,
  });
}

export function useChallengeHistory() {
  return useQuery({
    queryKey: ['challenges', 'history'],
    queryFn: getChallengeHistory,
    staleTime: 5 * 60_000,
  });
}

export function useDailyMissions() {
  return useQuery({
    queryKey: ['challenges', 'daily'],
    queryFn: getDailyMissions,
    staleTime: 30_000,
  });
}

export function useDailyMissionHistory() {
  return useQuery({
    queryKey: ['challenges', 'daily-history'],
    queryFn: getDailyMissionHistory,
    staleTime: 5 * 60_000,
  });
}
