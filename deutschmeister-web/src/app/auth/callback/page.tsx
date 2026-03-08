'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithOAuth } = useAuthStore();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.replace(`/auth/login?error=${encodeURIComponent(error || 'oauth_failed')}`);
      return;
    }

    loginWithOAuth(token)
      .then(() => {
        const { user } = useAuthStore.getState();
        router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
      })
      .catch(() => {
        router.replace('/auth/login?error=oauth_failed');
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', border: '3px solid rgba(99,102,241,0.3)',
          borderTop: '3px solid #6366F1', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Đang đăng nhập...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
