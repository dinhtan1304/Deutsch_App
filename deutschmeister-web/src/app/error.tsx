'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.1), rgba(239,68,68,.2))' }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#EF4444"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          Oops! Có lỗi xảy ra
        </h2>
        <p className="text-[13px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          Trang này gặp sự cố. Vui lòng thử lại.
        </p>

        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-5 py-2.5 rounded-xl font-semibold text-[14px] text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 12px rgba(59,130,246,.25)' }}>
            Thử lại
          </button>
          <a href="/"
            className="px-5 py-2.5 rounded-xl font-semibold text-[14px] transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}