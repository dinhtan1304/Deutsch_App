'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-50px) scale(1.08)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-link:hover { color: rgba(255,255,255,0.8) !important; }
        .submit-btn { transition: transform 0.2s, box-shadow 0.2s; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.5) !important; }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'float1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)', animation: 'float2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeUp 0.5s ease-out' }}>

          <Link href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', marginBottom: '28px', transition: 'color 0.2s' }} className="auth-link">
            ← Quay lại đăng nhập
          </Link>

          {!sent ? (
            <>
              <div style={{ marginBottom: '28px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 6px 20px rgba(99,102,241,0.35)', marginBottom: '20px' }}>
                  🔑
                </div>
                <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: '0 0 6px' }}>Quên mật khẩu?</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0 }}>Nhập email để nhận link đặt lại mật khẩu</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px', backdropFilter: 'blur(20px)' }}>

                {error && (
                  <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', fontSize: '13px' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <input
                        type="email" value={email} required
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                        placeholder="your@email.com"
                        className="auth-input"
                        style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', border: `1px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`, background: focused ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, background 0.2s', boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none' }}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading || !email.trim()} className="submit-btn"
                    style={{ padding: '14px', borderRadius: '14px', background: (isLoading || !email.trim()) ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: (isLoading || !email.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                    {isLoading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        Đang gửi...
                      </>
                    ) : 'Gửi link đặt lại mật khẩu'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '40px', boxShadow: '0 12px 40px rgba(99,102,241,0.35)' }}>
                ✉️
              </div>
              <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, margin: '0 0 12px' }}>Kiểm tra email!</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px' }}>
                Nếu <strong style={{ color: '#818CF8' }}>{email}</strong> tồn tại trong hệ thống,<br />
                chúng tôi đã gửi link đặt lại mật khẩu.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 28px' }}>
                Link có hiệu lực trong 1 giờ. Kiểm tra cả thư mục Spam.
              </p>
              <Link href="/auth/login" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
