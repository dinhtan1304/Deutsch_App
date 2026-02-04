'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    // Check auth status on mount
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}