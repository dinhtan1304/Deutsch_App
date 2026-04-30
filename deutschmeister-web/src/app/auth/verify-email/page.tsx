'use client';
/* eslint-disable no-restricted-syntax */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { MarketingAuthShell } from '@/components/ui/MarketingAuthShell';
import { IconMail, IconClock, IconInbox, IconLoader } from '@/components/ui/Icons';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';

function ResendButton({ email }: { email: string }) {
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setCooldown(60);
      setSent(true);
    } catch { /* ignore */ }
    setResending(false);
  };

  const disabled = cooldown > 0 || resending || !email;

  return (
    <div className="mb-3">
      {sent && cooldown > 0 && (
        <p className="mb-2 text-caption font-medium" style={{ color: '#4ADE80' }}>
          Email đã được gửi lại!
        </p>
      )}
      <button
        onClick={handleResend}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-md px-8 py-3 text-body font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        style={{
          background: disabled ? `${ACCENT.reading}4D` : GRADIENT.reading,
          boxShadow: disabled ? 'none' : `0 8px 24px ${ACCENT.reading}4D`,
        }}
      >
        {resending && <IconLoader size={16} />}
        {resending
          ? 'Đang gửi...'
          : cooldown > 0
            ? `Gửi lại sau ${cooldown}s`
            : 'Gửi lại email xác nhận'}
      </button>
    </div>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get('email') || '';

  return (
    <MarketingAuthShell orbAccent="green">
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-white"
        style={{
          background: GRADIENT.reading,
          boxShadow: `0 12px 40px ${ACCENT.reading}59`,
          animation: 'marketingPulse 3s ease-in-out infinite',
        }}
      >
        <IconMail size={36} aria-label="Email" />
      </div>

      <h1
        className="mb-3 text-h1 font-bold"
        style={{ color: 'var(--marketing-text)' }}
      >
        Kiểm tra email của bạn!
      </h1>

      <p className="mb-2 text-body" style={{ color: 'var(--marketing-muted)' }}>
        Chúng tôi đã gửi link xác nhận đến
      </p>
      {email && (
        <p
          className="mb-6 break-all text-body font-bold"
          style={{ color: STATUS.success }}
        >
          {email}
        </p>
      )}

      <div
        className="mb-7 rounded-2xl border px-6 py-5 text-left"
        style={{
          background: 'var(--marketing-panel)',
          borderColor: 'var(--marketing-border)',
        }}
      >
        <ul className="flex flex-col gap-2.5 text-body" style={{ color: 'var(--marketing-muted)' }}>
          <li className="flex items-start gap-2.5">
            <IconInbox size={18} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              Nhấn link trong email để kích hoạt tài khoản.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <IconClock size={18} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              Link có hiệu lực trong{' '}
              <strong style={{ color: 'var(--marketing-text)' }}>24 giờ</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <IconMail size={18} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              Kiểm tra cả thư mục{' '}
              <strong style={{ color: 'var(--marketing-text)' }}>Spam / Junk</strong> nếu
              không thấy.
            </span>
          </li>
        </ul>
      </div>

      <ResendButton email={email} />

      <Link
        href="/auth/login"
        className="mt-3 inline-block rounded-md px-8 py-3 text-body font-semibold transition-colors hover:opacity-80"
        style={{
          background: 'var(--marketing-panel)',
          color: 'var(--marketing-muted)',
        }}
      >
        Quay lại đăng nhập
      </Link>
    </MarketingAuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ backgroundColor: 'var(--marketing-bg)' }} />
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
