'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';

type Status = 'loading' | 'success' | 'error';

function ConfirmContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy token xác nhận.');
      return;
    }

    authApi.verifyEmail(token)
      .then(res => {
        setStatus('success');
        setMessage(res.message);
        setTimeout(() => router.push('/auth/login'), 3000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Xác nhận thất bại. Vui lòng thử lại.');
      });
  }, [token, router]);

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-50px) scale(1.08)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 70%)', animation: 'float1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.5s ease-out', textAlign: 'center' }}>

          {status === 'loading' && (
            <>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid rgba(34,197,94,0.2)', borderTop: '4px solid #22C55E', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: '0 0 10px' }}>Đang xác nhận...</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Vui lòng chờ trong giây lát</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #22C55E, #14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '40px', boxShadow: '0 12px 40px rgba(34,197,94,0.35)' }}>
                ✅
              </div>
              <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: '0 0 12px' }}>Email đã xác nhận!</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
                {message}<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Tự động chuyển đến trang đăng nhập sau 3 giây...</span>
              </p>
              <Link href="/auth/login" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #22C55E, #14B8A6)', color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
                Đăng nhập ngay
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '40px' }}>
                ❌
              </div>
              <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: '0 0 12px' }}>Xác nhận thất bại</h1>
              <p style={{ color: '#FCA5A5', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>{message}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/auth/register" style={{ padding: '13px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                  Đăng ký lại
                </Link>
                <Link href="/auth/login" style={{ padding: '13px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                  Đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1e' }} />}>
      <ConfirmContent />
    </Suspense>
  );
}
