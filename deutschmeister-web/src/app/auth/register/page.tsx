'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  IconArrowLeft, IconUser, IconMail, IconLock, IconLoader,
  IconEye, IconEyeOff, IconUserPlus, IconCheckCircle,
} from '@/components/ui/Icons';

// ─── Password rules ────────────────────────────────────────────────────────────
const PW_RULES = [
  { id: 'length',    label: 'Ít nhất 8 ký tự',   test: (p: string) => p.length >= 8 },
  { id: 'lower',     label: 'Chữ thường (a-z)',    test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper',     label: 'Chữ hoa (A-Z)',       test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number',    label: 'Có số (0-9)',          test: (p: string) => /\d/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    const results = PW_RULES.map(r => ({ ...r, ok: r.test(password) }));
    const score = results.filter(r => r.ok).length;
    const colors = ['', '#EF4444', '#F97316', '#F59E0B', '#22C55E'];
    const labels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
    return { results, score, pct: (score / PW_RULES.length) * 100, color: colors[score], label: labels[score] };
  }, [password]);

  if (!password) return null;

  return (
    <div style={{ marginTop: '10px' }}>
      {/* Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1, height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '4px', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.4s ease, background 0.4s ease' }} />
        </div>
        {strength.label && <span style={{ fontSize: '11px', fontWeight: 700, color: strength.color, minWidth: '54px', textAlign: 'right' }}>{strength.label}</span>}
      </div>
      {/* Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {strength.results.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: r.ok ? '#4ADE80' : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `1.5px solid ${r.ok ? '#4ADE80' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: r.ok ? 'rgba(74,222,128,0.15)' : 'transparent', transition: 'all 0.2s' }}>
              {r.ok && <IconCheckCircle size={12} />}
            </div>
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated, _hasHydrated } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) router.replace('/dashboard');
  }, [_hasHydrated, isAuthenticated, router]);

  const isPasswordValid = useMemo(() => PW_RULES.every(r => r.test(password)), [password]);
  const isFormValid = useMemo(
    () => isPasswordValid && password === confirmPassword && name.trim().length >= 2,
    [isPasswordValid, password, confirmPassword, name]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Tên phải có ít nhất 2 ký tự'); return; }
    if (!isPasswordValid) { setError('Mật khẩu chưa đủ mạnh.'); return; }
    if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    try {
      await register({ name: name.trim(), email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  if (!_hasHydrated || isAuthenticated) {
    return <div style={{ minHeight: '100vh', background: '#0a0f1e' }} />;
  }

  const inputStyle = (field: string, extra?: React.CSSProperties): React.CSSProperties => ({
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
    ...extra,
  });

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-50px) scale(1.08)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-link:hover { color: rgba(255,255,255,0.8) !important; }
        .pw-toggle { background:none; border:none; cursor:pointer; padding:4px; color:rgba(255,255,255,0.35); transition:color 0.2s; display:flex; align-items:center; }
        .pw-toggle:hover { color:rgba(255,255,255,0.7); }
        .submit-btn { transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(34,197,94,0.45) !important; }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 70%)', animation: 'float1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)', animation: 'float2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '40%', left: '35%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', animation: 'float3 13s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.5s ease-out' }}>

          {/* Back */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', marginBottom: '28px', transition: 'color 0.2s' }} className="auth-link">
            <IconArrowLeft /> Trang chủ
          </Link>

          {/* Brand + heading */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #22C55E, #14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 6px 20px rgba(34,197,94,0.35)', flexShrink: 0 }}>
                🇩🇪
              </div>
              <div style={{ background: 'linear-gradient(135deg, #4ADE80, #2DD4BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '20px', fontWeight: 800 }}>
                Deutschmeister
              </div>
            </div>
            <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: '0 0 6px' }}>Tạo tài khoản miễn phí</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0 }}>Bắt đầu hành trình chinh phục tiếng Đức ngay hôm nay!</p>
          </div>

          {/* Card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px', backdropFilter: 'blur(20px)' }}>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', fontSize: '13px', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Name */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Họ tên</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'flex' }}>
                    <IconUser />
                  </div>
                  <input type="text" value={name} required minLength={2} maxLength={100}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                    placeholder="Nguyễn Văn A"
                    className="auth-input" style={inputStyle('name')} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'flex' }}>
                    <IconMail />
                  </div>
                  <input type="email" value={email} required
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    placeholder="email@example.com"
                    className="auth-input" style={inputStyle('email')} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'flex' }}>
                    <IconLock />
                  </div>
                  <input type={showPw ? 'text' : 'password'} value={password} required maxLength={50}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    placeholder="Nhập mật khẩu"
                    className="auth-input" style={inputStyle('password', { paddingRight: '44px' })} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="pw-toggle"
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'flex' }}>
                    <IconLock />
                  </div>
                  <input type={showPw ? 'text' : 'password'} value={confirmPassword} required
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                    placeholder="Nhập lại mật khẩu"
                    className="auth-input"
                    style={inputStyle('confirm', {
                      borderColor: confirmPassword && confirmPassword !== password
                        ? 'rgba(239,68,68,0.5)'
                        : confirmPassword && confirmPassword === password
                        ? 'rgba(74,222,128,0.5)'
                        : focused === 'confirm' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)',
                    })} />
                  {/* Match indicator */}
                  {confirmPassword && (
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>
                      {confirmPassword === password ? '✓' : ''}
                    </div>
                  )}
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ marginTop: '6px', fontSize: '11px', color: '#FCA5A5' }}>Mật khẩu không khớp</p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={!isFormValid || isLoading} className="submit-btn"
                style={{ marginTop: '4px', padding: '14px', borderRadius: '14px', background: (!isFormValid || isLoading) ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22C55E, #14B8A6)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: (!isFormValid || isLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
                {isLoading ? <><IconLoader /> Đang đăng ký...</> : <><IconUserPlus /> Đăng ký</>}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>hoặc</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
            Đã có tài khoản?{' '}
            <Link href="/auth/login" style={{ color: '#4ADE80', fontWeight: 600, textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
