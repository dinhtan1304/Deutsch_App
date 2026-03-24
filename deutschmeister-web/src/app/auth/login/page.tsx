'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuthStore } from '@/stores/authStore';
import {
  IconArrowLeft, IconMail, IconLock, IconLogIn, IconLoader, IconEye, IconEyeOff,
  IconBook, IconGamepad, IconBrain, IconFlame,
} from '@/components/ui/Icons';

// ─── Feature highlights shown in the left panel ───────────────────────────────
const HIGHLIGHTS = [
  { icon: IconBook,    color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   text: '140+ từ vựng A1 chuẩn Goethe' },
  { icon: IconGamepad, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  text: '8 mini-game học từ hấp dẫn' },
  { icon: IconBrain,   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  text: 'AI Gemini chấm 4 kỹ năng thi' },
  { icon: IconFlame,   color: '#F97316', bg: 'rgba(249,115,22,0.12)',  text: 'Streak hàng ngày — không bỏ lỡ' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, user, _hasHydrated } = useAuthStore();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('login') : undefined;
      await login({ email: email.trim(), password, captchaToken });
      const { user: loggedInUser } = useAuthStore.getState();
      router.push(loggedInUser?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setError('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư và nhấn link xác nhận.');
      } else {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
  }, [executeRecaptcha, email, password, login, router]);

  if (!_hasHydrated || isAuthenticated) {
    return <div style={{ minHeight: '100vh', background: '#0a0f1e' }} />;
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: '12px',
    border: `1px solid ${focused === field ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
    background: focused === field ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
  });

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-50px) scale(1.08)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeLeft { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-link:hover { color: rgba(255,255,255,0.8) !important; }
        .pw-toggle { background:none; border:none; cursor:pointer; padding:4px; color:rgba(255,255,255,0.35); transition:color 0.2s; display:flex; align-items:center; }
        .pw-toggle:hover { color:rgba(255,255,255,0.7); }
        .submit-btn { transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.5) !important; }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .highlight-item { animation: fadeLeft 0.5s ease-out both; }
        .highlight-item:nth-child(1){animation-delay:0.1s} .highlight-item:nth-child(2){animation-delay:0.2s}
        .highlight-item:nth-child(3){animation-delay:0.3s} .highlight-item:nth-child(4){animation-delay:0.4s}
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'float1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)', animation: 'float2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '50%', left: '40%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', animation: 'float3 13s ease-in-out infinite' }} />
        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>

        {/* ── Left panel (desktop only) ── */}
        <div style={{ display: 'none', flex: '0 0 440px', padding: '48px', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }} className="lg-flex">
          <style>{`.lg-flex { display: flex !important; } @media(max-width:1023px){.lg-flex{display:none!important}}`}</style>

          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', marginBottom: '64px', transition: 'color 0.2s' }} className="auth-link">
            <IconArrowLeft /> Trang chủ
          </Link>

          {/* Brand */}
          <div style={{ marginBottom: '48px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" width={64} height={64} alt="Deutschmeister" style={{ borderRadius: '20px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', marginBottom: '20px' }} />
            <div style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '28px', fontWeight: 800, lineHeight: 1.1, marginBottom: '12px' }}>
              Deutschmeister
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.6, maxWidth: '300px' }}>
              Nền tảng học tiếng Đức toàn diện — từ từ vựng đến luyện thi Goethe & TELC.
            </p>
          </div>

          {/* Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {HIGHLIGHTS.map((h, i) => (
              <div key={i} className="highlight-item" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: h.bg, border: `1px solid ${h.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: h.color }}>
                  <h.icon size={20} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{h.text}</span>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div style={{ marginTop: '48px', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
              "Học tiếng Đức chưa bao giờ thú vị đến vậy — AI chấm bài, game từ vựng, và luyện thi chuẩn Goethe trong một app."
            </p>
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>

          {/* Mobile back link */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }} className="mobile-back">
            <style>{`.mobile-back { display: block; } @media(min-width:1024px){.mobile-back{display:none}}`}</style>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }} className="auth-link">
              <IconArrowLeft /> Trang chủ
            </Link>
          </div>

          <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeUp 0.5s ease-out' }}>

            {/* Mobile brand logo */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }} className="mobile-brand">
              <style>{`.mobile-brand { display: block; } @media(min-width:1024px){.mobile-brand{display:none}}`}</style>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" width={56} height={56} alt="Deutschmeister" style={{ borderRadius: '18px', boxShadow: '0 8px 24px rgba(99,102,241,0.35)', margin: '0 auto 12px' }} />
              <div style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '20px', fontWeight: 800 }}>
                Deutschmeister
              </div>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 700, margin: '0 0 6px' }}>Chào mừng trở lại!</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0 }}>Đăng nhập để tiếp tục học tiếng Đức</p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', fontSize: '13px', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Email */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'flex' }}>
                    <IconMail />
                  </div>
                  <input
                    type="email" value={email} required
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="your@email.com"
                    className="auth-input"
                    style={inputStyle('email')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600 }}>Mật khẩu</label>
                  <Link href="/auth/forgot-password" style={{ color: '#818CF8', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'flex' }}>
                    <IconLock />
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'} value={password} required
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="auth-input"
                    style={{ ...inputStyle('password'), paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="pw-toggle"
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="submit-btn"
                style={{ marginTop: '4px', padding: '14px', borderRadius: '14px', background: isLoading ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg, #3B82F6, #6366F1)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
                {isLoading ? <><IconLoader /> Đang đăng nhập...</> : <><IconLogIn /> Đăng nhập</>}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>hoặc tiếp tục với</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Social login buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '12px', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 500,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                className="social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Tiếp tục với Google
              </a>

              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/auth/facebook`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '12px', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 500,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                className="social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Tiếp tục với Facebook
              </a>
            </div>
            <style>{`.social-btn:hover { background: rgba(255,255,255,0.09) !important; border-color: rgba(255,255,255,0.2) !important; }`}</style>

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '20px 0 0' }}>
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" style={{ color: '#818CF8', fontWeight: 600, textDecoration: 'none' }}>
                Đăng ký miễn phí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
