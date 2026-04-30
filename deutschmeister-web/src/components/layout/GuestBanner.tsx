'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { GRADIENT } from '@/lib/tokens';

const DISMISSED_KEY = 'dm-guest-banner-dismissed';

export function GuestBanner() {
  const { isAuthenticated } = useAuthStore();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISSED_KEY) === '1');
  }, []);

  if (isAuthenticated || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      className="sticky top-16 z-30 flex items-center justify-between gap-3 px-4 py-2 text-white text-sm font-medium"
      style={{ background: GRADIENT.brand }}
    >
      <span className="min-w-0 truncate">
        Bạn đang xem với tư cách khách —{' '}
        <Link href="/auth/register" className="underline font-bold hover:opacity-80 transition-opacity">
          Đăng ký miễn phí
        </Link>{' '}
        để lưu tiến trình học
      </span>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Đóng thông báo"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
