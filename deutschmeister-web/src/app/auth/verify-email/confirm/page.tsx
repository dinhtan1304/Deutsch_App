'use client';
/* eslint-disable no-restricted-syntax */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { MarketingAuthShell } from '@/components/ui/MarketingAuthShell';
import { IconCheck, IconX } from '@/components/ui/Icons';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';

type Status = 'loading' | 'success' | 'error';

function ConfirmContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'Không tìm thấy token xác nhận.');

  useEffect(() => {
    if (!token) return;

    authApi.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        setTimeout(() => router.push('/auth/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Xác nhận thất bại. Vui lòng thử lại.');
      });
  }, [token, router]);

  if (status === 'loading') {
    return (
      <MarketingAuthShell orbAccent="green">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-4 text-white"
          style={{ borderColor: `${ACCENT.reading}33`, borderTopColor: ACCENT.reading, animation: 'spin 1s linear infinite' }}
          aria-label="Đang xác nhận"
        />
        <h1 className="mb-2.5 text-h2 font-bold" style={{ color: 'var(--marketing-text)' }}>
          Đang xác nhận...
        </h1>
        <p className="text-body" style={{ color: 'var(--marketing-muted)' }}>
          Vui lòng chờ trong giây lát
        </p>
      </MarketingAuthShell>
    );
  }

  if (status === 'success') {
    return (
      <MarketingAuthShell orbAccent="green">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-white"
          style={{
            background: GRADIENT.reading,
            boxShadow: `0 12px 40px ${ACCENT.reading}59`,
          }}
        >
          <IconCheck size={40} strokeWidth={3} aria-label="Thành công" />
        </div>
        <h1 className="mb-3 text-h1 font-bold" style={{ color: 'var(--marketing-text)' }}>
          Email đã xác nhận!
        </h1>
        <p className="mb-1.5 text-body leading-relaxed" style={{ color: 'var(--marketing-muted)' }}>
          {message}
        </p>
        <p className="mb-6 text-caption" style={{ color: 'var(--marketing-dim)' }}>
          Tự động chuyển đến trang đăng nhập sau 3 giây...
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md px-8 py-3 text-body font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: GRADIENT.reading,
            boxShadow: `0 8px 24px ${ACCENT.reading}4D`,
          }}
        >
          Đăng nhập ngay
        </Link>
      </MarketingAuthShell>
    );
  }

  return (
    <MarketingAuthShell>
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border"
        style={{
          background: `${STATUS.danger}26`,
          borderColor: `${STATUS.danger}4D`,
        }}
      >
        <IconX size={40} aria-label="Xác nhận thất bại" style={{ color: '#FCA5A5' }} />
      </div>
      <h1 className="mb-3 text-h1 font-bold" style={{ color: 'var(--marketing-text)' }}>
        Xác nhận thất bại
      </h1>
      <p className="mb-6 text-body leading-relaxed" style={{ color: 'var(--marketing-error)' }}>
        {message}
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/auth/register"
          className="rounded-md border px-6 py-3 text-body font-semibold transition-colors hover:opacity-80"
          style={{
            background: 'var(--marketing-panel)',
            borderColor: 'var(--marketing-border)',
            color: 'var(--marketing-text)',
          }}
        >
          Đăng ký lại
        </Link>
        <Link
          href="/auth/login"
          className="rounded-md px-6 py-3 text-body font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: 'var(--marketing-submit)',
            boxShadow: 'var(--marketing-submit-shadow)',
          }}
        >
          Đăng nhập
        </Link>
      </div>
    </MarketingAuthShell>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ backgroundColor: 'var(--marketing-bg)' }} />
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
