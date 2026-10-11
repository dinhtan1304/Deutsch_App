import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failures, error) => {
          if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          )
            return false;
          return failures < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}
