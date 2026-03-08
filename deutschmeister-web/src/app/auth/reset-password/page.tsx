'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';

const PW_RULES = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (p: string) => p.length >= 8 },
  { id: 'lower',  label: 'Chữ thường (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper',  label: 'Chữ hoa (A-Z)',    test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Có số (0-9)',       test: (p: string) => /\d/.test(p) },
];

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const pwResults = useMemo(() => PW_RULES.map(r => ({ ...r, ok: r.test(password) })), [password]);
  const pwScore = pwResults.filter(r => r.ok).length;
  const pwColors = ['', '#EF4444', '#F97316', '#F59E0B', '#22C55E'];
  const pwLabels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  const isPasswordValid = pwScore === PW_RULES.length;
  const isFormValid = isPasswordValid && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

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
    transition: 'border-color 0.2s, background 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
    paddingRight: '44px',
  });

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <p style={{ color: '#FCA5A5', marginBottom: '16px' }}>Link không hợp lệ.</p>
          <Link href="/auth/forgot-password" style={{ color: '#818CF8' }}>Yêu cầu link mới</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-50px) scale(1.08)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .pw-toggle { background:none; border:none; cursor:pointer; padding:4px; color:rgba(255,255,255,0.35); transition:color 0.2s; display:flex; align-items:center; }
        .pw-toggle:hover { color:rgba(255,255,255,0.7); }
        .submit-btn { transition: transform 0.2s, box-shadow 0.2s; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.5) !important; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'float1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', animation: 'float2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.5s ease-out' }}>

          {!done ? (
            <>
              <div style={{ marginBottom: '28px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 6px 20px rgba(99,102,241,0.35)', marginBottom: '20px' }}>
                  🔐
                </div>
                <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: '0 0 6px' }}>Đặt mật khẩu mới</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0 }}>Nhập mật khẩu mới cho tài khoản của bạn</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px', backdropFilter: 'blur(20px)' }}>

                {error && (
                  <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', fontSize: '13px' }}>
                    {error}
                    {(error.includes('hết hạn') || error.includes('không hợp lệ')) && (
                      <div style={{ marginTop: '8px' }}>
                        <Link href="/auth/forgot-password" style={{ color: '#818CF8', fontSize: '13px' }}>Yêu cầu link mới →</Link>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input
                        type={showPw ? 'text' : 'password'} value={password} required maxLength={50}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)}
                        placeholder="Nhập mật khẩu mới"
                        className="auth-input" style={inputStyle('pw')}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="pw-toggle"
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        {showPw ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ flex: 1, height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '4px', width: `${(pwScore / PW_RULES.length) * 100}%`, background: pwColors[pwScore], transition: 'width 0.4s ease' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: pwColors[pwScore], minWidth: '54px', textAlign: 'right' }}>{pwLabels[pwScore]}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                          {pwResults.map(r => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: r.ok ? '#4ADE80' : 'rgba(255,255,255,0.35)' }}>
                              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1.5px solid ${r.ok ? '#4ADE80' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {r.ok && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                              </div>
                              {r.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm */}
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Xác nhận mật khẩu</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input
                        type={showPw ? 'text' : 'password'} value={confirm} required
                        onChange={e => setConfirm(e.target.value)}
                        onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                        placeholder="Nhập lại mật khẩu"
                        className="auth-input"
                        style={{ ...inputStyle('confirm'), borderColor: confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : confirm && confirm === password ? 'rgba(74,222,128,0.5)' : focused === 'confirm' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)' }}
                      />
                    </div>
                    {confirm && confirm !== password && (
                      <p style={{ marginTop: '6px', fontSize: '11px', color: '#FCA5A5' }}>Mật khẩu không khớp</p>
                    )}
                  </div>

                  <button type="submit" disabled={!isFormValid || isLoading} className="submit-btn"
                    style={{ marginTop: '4px', padding: '14px', borderRadius: '14px', background: (!isFormValid || isLoading) ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: (!isFormValid || isLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                    {isLoading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Đang xử lý...
                      </>
                    ) : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #22C55E, #14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '40px', boxShadow: '0 12px 40px rgba(34,197,94,0.35)' }}>
                ✅
              </div>
              <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, margin: '0 0 12px' }}>Mật khẩu đã được đặt lại!</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
                Tự động chuyển đến trang đăng nhập sau 3 giây...
              </p>
              <Link href="/auth/login" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #22C55E, #14B8A6)', color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                Đăng nhập ngay
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1e' }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
