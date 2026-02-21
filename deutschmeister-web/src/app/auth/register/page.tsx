'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// ─── Inline SVG Icons ───
function IconLoader({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function IconUserPlus({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
function IconEye({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const PASSWORD_RULES = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (p: string) => p.length >= 8 },
  { id: 'lowercase', label: 'Có chữ thường (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'Có chữ hoa (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Có số (0-9)', test: (p: string) => /\d/.test(p) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => {
    // Compute each rule's result once — reused in both the bar and the rule list
    const results = PASSWORD_RULES.map(r => ({ ...r, passed: r.test(password) }));
    const score = results.filter(r => r.passed).length;
    return {
      results,
      score,
      percent: (score / PASSWORD_RULES.length) * 100,
      label: score === 0 ? '' : score <= 1 ? 'Yếu' : score <= 2 ? 'Trung bình' : score <= 3 ? 'Khá' : 'Mạnh',
      color: score <= 1 ? '#EF4444' : score <= 2 ? '#F97316' : score <= 3 ? '#F59E0B' : '#22C55E',
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strength.percent}%`, backgroundColor: strength.color }} />
        </div>
        {strength.label && (
          <span className="text-[11px] font-bold" style={{ color: strength.color }}>{strength.label}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {strength.results.map(rule => (
          <div key={rule.id} className="flex items-center gap-1.5 text-[11px] transition-colors"
            style={{ color: rule.passed ? '#22C55E' : 'var(--theme-text-muted)' }}>
            <span className="text-[12px]">{rule.passed ? '✓' : '○'}</span>
            <span>{rule.label}</span>
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Redirect already-authenticated users away from register page
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace('/');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const isPasswordValid = useMemo(() => PASSWORD_RULES.every(r => r.test(password)), [password]);
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
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  // Avoid flashing form while hydration or redirect is in flight
  if (!_hasHydrated || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-border)', borderTopColor: '#22C55E' }} />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="w-full max-w-md rounded-2xl border p-8"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}>
            <span className="text-3xl">🇩🇪</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Tạo tài khoản</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>Bắt đầu hành trình học tiếng Đức!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-[13px]"
            style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Họ tên</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              style={inputStyle} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="email@example.com"
              className="w-full px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              style={inputStyle} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Mật khẩu</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required maxLength={50}
                placeholder="Nhập mật khẩu"
                className="w-full px-4 py-3 pr-12 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                style={inputStyle} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--theme-text-muted)' }}>
                {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Xác nhận mật khẩu</label>
            <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              placeholder="Nhập lại mật khẩu"
              className="w-full px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              style={{
                ...inputStyle,
                borderColor: confirmPassword && confirmPassword !== password ? 'rgba(239,68,68,.5)' : 'var(--theme-border)',
              }} />
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-[11px]" style={{ color: '#EF4444' }}>Mật khẩu không khớp</p>
            )}
          </div>

          <button type="submit" disabled={!isFormValid || isLoading}
            className="w-full py-3 rounded-xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)', boxShadow: '0 4px 12px rgba(34,197,94,.3)' }}>
            {isLoading ? <><IconLoader size={18} /> Đang đăng ký...</> : <><IconUserPlus size={18} /> Đăng ký</>}
          </button>
        </form>

        <p className="text-center text-[13px] mt-6" style={{ color: 'var(--theme-text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link href="/auth/login" className="font-semibold" style={{ color: '#3B82F6' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}