'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi, type ErrorPattern } from '@/lib/api/users';

export function useErrorPatterns() {
  return useQuery<ErrorPattern[]>({
    queryKey: ['error-patterns'],
    queryFn: () => usersApi.getErrorPatterns(),
    staleTime: 5 * 60 * 1000,
  });
}
