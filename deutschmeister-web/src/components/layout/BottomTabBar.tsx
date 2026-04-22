'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ACCENT } from '@/lib/tokens';

interface Tab {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GamesIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <rect x="2" y="6" width="20" height="12" rx="3" />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function WordsIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const TABS: Tab[] = [
  { href: '/dashboard', label: 'Trang chủ', icon: <HomeIcon /> },
  { href: '/games', label: 'Trò chơi', icon: <GamesIcon /> },
  { href: '/practice-test', label: 'Luyện thi', icon: <PracticeIcon /> },
  { href: '/words', label: 'Từ vựng', icon: <WordsIcon /> },
  { href: '/profile', label: 'Hồ sơ', icon: <ProfileIcon /> },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <>
      {/* spacer prevents content from being hidden behind the bar */}
      <div aria-hidden="true" className="md:hidden" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
      <nav
        aria-label="Navigation chính"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch" style={{ height: 64 }}>
          {TABS.map(tab => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
            const color = active ? ACCENT.srs : 'var(--theme-text-muted)';
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color }}
                aria-current={active ? 'page' : undefined}
              >
                <span className="transition-transform" style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}>
                  {tab.icon}
                </span>
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 w-8 h-0.5 rounded-full"
                    style={{ background: ACCENT.srs }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
