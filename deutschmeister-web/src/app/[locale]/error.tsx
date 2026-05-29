'use client';
/* eslint-disable no-restricted-syntax */

import { useEffect } from 'react';
import Link from 'next/link';
import { GRADIENT, STATUS } from '@/lib/tokens';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log errors only in development — avoid leaking details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: GRADIENT.dangerBg }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={STATUS.danger}
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          Oops! Có lỗi xảy ra
        </h2>
        <p className="text-body mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          Trang này gặp sự cố. Vui lòng thử lại.
        </p>

        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: GRADIENT.action, boxShadow: '0 4px 12px rgba(59,130,246,.25)' }}>
            Thử lại
          </button>
          <Link href="/"
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}