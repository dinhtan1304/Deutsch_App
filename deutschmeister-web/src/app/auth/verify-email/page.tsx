'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { authApi } from '@/lib/api/auth';

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
    <div style={{ marginBottom: '12px' }}>
      {sent && cooldown > 0 && (
        <p style={{ color: '#4ADE80', fontSize: '13px', marginBottom: '8px' }}>
          Email đã được gửi lại!
        </p>
      )}
      <button
        onClick={handleResend}
        disabled={disabled}
        style={{
          display: 'inline-block', padding: '13px 32px', borderRadius: '12px',
          background: disabled ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #22C55E, #14B8A6)',
          color: 'white', fontWeight: 700, fontSize: '14px', border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: disabled ? 'none' : '0 8px 24px rgba(34,197,94,0.3)',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {resending ? 'Đang gửi...' : cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email xác nhận'}
      </button>
    </div>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get('email') || '';

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-50px) scale(1.08)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 70%)', animation: 'float1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)', animation: 'float2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '480px', animation: 'fadeUp 0.5s ease-out', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #22C55E, #14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '40px', boxShadow: '0 12px 40px rgba(34,197,94,0.35)', animation: 'pulse 3s ease-in-out infinite' }}>
            ✉️
          </div>

          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: '0 0 12px' }}>
            Kiểm tra email của bạn!
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 8px' }}>
            Chúng tôi đã gửi link xác nhận đến
          </p>
          {email && (
            <p style={{ color: '#4ADE80', fontWeight: 700, fontSize: '15px', margin: '0 0 24px', wordBreak: 'break-all' }}>
              {email}
            </p>
          )}

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', textAlign: 'left' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              📬 Nhấn link trong email để kích hoạt tài khoản.<br />
              ⏱ Link có hiệu lực trong <strong style={{ color: 'white' }}>24 giờ</strong>.<br />
              📁 Kiểm tra cả thư mục <strong style={{ color: 'white' }}>Spam / Junk</strong> nếu không thấy.
            </p>
          </div>

          <ResendButton email={email} />

          <Link
            href="/auth/login"
            style={{ display: 'inline-block', padding: '13px 32px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', textDecoration: 'none', marginTop: '12px' }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1e' }} />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
