'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const t = useTranslations('common.ui');
  const router = useRouter();
  const pathname = usePathname();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const returnTo = useMemo(() => {
    if (typeof window === 'undefined') return pathname;
    return `${window.location.pathname}${window.location.search}`;
  }, [pathname]);

  useEffect(() => {
    if (!_hasHydrated || isLoading || isAuthenticated) return;
    router.replace(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [_hasHydrated, isLoading, isAuthenticated, returnTo, router]);

  if (!_hasHydrated || isLoading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center px-4 text-sm"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {t('checkingAuth')}
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
