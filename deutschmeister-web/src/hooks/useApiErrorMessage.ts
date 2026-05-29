'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { ApiError, type ApiErrorCode } from '@/lib/api/client';

const CODE_KEY: Record<ApiErrorCode, 'authExpired' | 'authRequired'> = {
  AUTH_EXPIRED: 'authExpired',
  AUTH_REQUIRED: 'authRequired',
};

/**
 * Returns a translator that turns any thrown value into a user-facing,
 * localized message. Resolution order:
 *   1. ApiError.code → translated `errors.*` key (locale-independent)
 *   2. backend-provided message string (still server-localized)
 *   3. generic fallback in the current locale
 */
export function useApiErrorMessage() {
  const t = useTranslations('errors');

  return useCallback(
    (err: unknown): string => {
      if (err instanceof ApiError) {
        if (err.code) return t(CODE_KEY[err.code]);
        const raw = (err.data as { message?: unknown } | undefined)?.message ?? err.message;
        if (Array.isArray(raw)) return raw.filter(Boolean).join(' · ') || t('generic');
        if (typeof raw === 'string' && raw.length > 0) return raw;
        return t('generic');
      }
      if (err instanceof Error && err.message) return err.message;
      return t('generic');
    },
    [t],
  );
}
