'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const { login, isLoading, isAuthenticated, _hasHydrated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) router.replace('/dashboard');
  }, [_hasHydrated, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email: email.trim(), password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

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
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '34px', color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>D</span>
            </div>
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
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.35)', margin: '0 auto 12px' }}>
                <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '30px', color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>D</span>
              </div>
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
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Mật khẩu</label>
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
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>hoặc</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
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
