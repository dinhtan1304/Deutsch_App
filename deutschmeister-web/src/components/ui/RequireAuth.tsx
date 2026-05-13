'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { _hasHydrated, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [checked, setChecked] = useState(false);

  const returnTo = useMemo(() => {
    if (typeof window === 'undefined') return pathname;
    return `${window.location.pathname}${window.location.search}`;
  }, [pathname]);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;
    setChecked(false);

    fetchUser().finally(() => {
      if (!cancelled) setChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, fetchUser]);

  useEffect(() => {
    if (!_hasHydrated || !checked || isLoading || isAuthenticated) return;
    router.replace(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [_hasHydrated, checked, isAuthenticated, isLoading, returnTo, router]);

  if (!_hasHydrated || !checked || isLoading || !isAuthenticated) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center px-4 text-sm"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return <>{children}</>;
}
