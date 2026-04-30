'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { authApi } from '@/lib/api/auth';
import { MarketingAuthShell } from '@/components/ui/MarketingAuthShell';
import { FormField } from '@/components/ui/FormField';
import {
  IconKey, IconMail, IconArrowLeft, IconLoader,
} from '@/components/ui/Icons';
import { GRADIENT, ACCENT } from '@/lib/tokens';

export default function ForgotPasswordPage() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('forgot_password') : undefined;
      await authApi.forgotPassword(email.trim(), captchaToken);
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [executeRecaptcha, email]);

  if (sent) {
    return (
      <MarketingAuthShell orbAccent="indigo">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-white"
          style={{
            background: GRADIENT.writing,
            boxShadow: `0 12px 40px ${ACCENT.writing}59`,
          }}
        >
          <IconMail size={36} aria-label="Email đã gửi" />
        </div>
        <h1
          className="mb-3 text-h1 font-bold"
          style={{ color: 'var(--marketing-text)' }}
        >
          Kiểm tra email!
        </h1>
        <p className="mb-2 text-body leading-relaxed" style={{ color: 'var(--marketing-muted)' }}>
          Nếu{' '}
          <strong style={{ color: 'var(--marketing-link)' }}>{email}</strong>{' '}
          tồn tại trong hệ thống,<br />
          chúng tôi đã gửi link đặt lại mật khẩu.
        </p>
        <p className="mb-7 text-caption" style={{ color: 'var(--marketing-dim)' }}>
          Link có hiệu lực trong 1 giờ. Kiểm tra cả thư mục Spam.
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md px-8 py-3 text-body font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: 'var(--marketing-submit)',
            boxShadow: 'var(--marketing-submit-shadow)',
          }}
        >
          Quay lại đăng nhập
        </Link>
      </MarketingAuthShell>
    );
  }

  return (
    <MarketingAuthShell centered={false} maxWidth={420}>
      <Link
        href="/auth/login"
        className="mb-7 inline-flex items-center gap-1.5 text-caption transition-colors hover:opacity-80"
        style={{ color: 'var(--marketing-dim)' }}
      >
        <IconArrowLeft size={14} aria-hidden />
        Quay lại đăng nhập
      </Link>

      <div className="mb-7">
        <div
          className="mb-5 flex items-center justify-center rounded-2xl text-white"
          style={{
            width: 52,
            height: 52,
            background: GRADIENT.writing,
            boxShadow: `0 6px 20px ${ACCENT.writing}59`,
          }}
        >
          <IconKey size={24} aria-label="Khôi phục mật khẩu" />
        </div>
        <h1
          className="mb-1.5 text-h1 font-bold"
          style={{ color: 'var(--marketing-text)' }}
        >
          Quên mật khẩu?
        </h1>
        <p className="text-body" style={{ color: 'var(--marketing-muted)' }}>
          Nhập email để nhận link đặt lại mật khẩu
        </p>
      </div>

      <div
        className="rounded-3xl border p-7"
        style={{
          background: 'var(--marketing-panel)',
          borderColor: 'var(--marketing-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {error && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-caption"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.25)',
              color: 'var(--marketing-error)',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            variant="marketing"
            label="Email"
            type="email"
            name="email"
            icon={<IconMail size={16} />}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-body font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{
              background: (isLoading || !email.trim())
                ? 'rgba(99,102,241,0.4)'
                : 'var(--marketing-submit)',
              boxShadow: 'var(--marketing-submit-shadow)',
            }}
          >
            {isLoading && <IconLoader size={16} />}
            {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </MarketingAuthShell>
  );
}
