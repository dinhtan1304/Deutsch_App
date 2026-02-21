'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
function IconLogIn({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, _hasHydrated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect already-authenticated users away from login page
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace('/');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email: email.trim(), password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  // Avoid flashing form while hydration or redirect is in flight
  if (!_hasHydrated || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-border)', borderTopColor: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="w-full max-w-md rounded-2xl border p-8"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <span className="text-3xl">🇩🇪</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Chào mừng trở lại!</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>Đăng nhập để tiếp tục học tiếng Đức</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-[13px]"
              style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }} />
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 12px rgba(59,130,246,.3)' }}>
            {isLoading ? <><IconLoader size={18} /> Đang đăng nhập...</> : <><IconLogIn size={18} /> Đăng nhập</>}
          </button>
        </form>

        <p className="text-center text-[13px] mt-6" style={{ color: 'var(--theme-text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="font-semibold" style={{ color: '#3B82F6' }}>Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}