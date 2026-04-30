'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GRADIENT } from '@/lib/tokens';

interface AuthGateProps {
  icon: React.ReactNode;
  gradient?: string;
  title: string;
  description: string;
}

export function AuthGate({ icon, gradient = GRADIENT.brand, title, description }: AuthGateProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: gradient }}>
        {icon}
      </div>
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        {title}
      </h1>
      <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
        {description}
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href={`/auth/login?returnTo=${pathname}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: GRADIENT.brand }}
        >
          Đăng nhập
        </Link>
        <Link
          href={`/auth/register?returnTo=${pathname}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-opacity hover:opacity-80"
          style={{ color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}
        >
          Đăng ký miễn phí
        </Link>
      </div>
    </div>
  );
}
