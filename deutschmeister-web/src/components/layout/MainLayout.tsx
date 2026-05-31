'use client';

import { ReactNode, useCallback, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';
import { GuestBanner } from './GuestBanner';
import { Breadcrumb } from '@/components/ui';
import { GRADIENT } from '@/lib/tokens';

const CommandPalette = dynamic(() => import('./CommandPalette').then((mod) => mod.CommandPalette), { ssr: false });

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'deutschmeister-sidebar-collapsed';

// Routes that should render WITHOUT sidebar/header (full-screen)
const BARE_ROUTES = ['/auth/login', '/auth/register', '/auth', '/', '/landing', '/admin', '/onboarding', '/privacy', '/terms', '/pricing'];

// Per-route accent (v2 redesign). Maps a route prefix → an .acc-* class that
// overrides --accent on the shell so the whole page picks up the right hue.
// Default (no match) = indigo (dashboard/vocab/notebook/profile/settings).
const ACCENT_ROUTES: { prefix: string; cls: string }[] = [
  { prefix: '/practice-test/reading', cls: 'acc-green' },
  { prefix: '/practice-test/listening', cls: 'acc-cyan' },
  { prefix: '/practice-test/dictation', cls: 'acc-cyan' },
  { prefix: '/practice-test/speaking-rooms', cls: 'acc-pink' },
  { prefix: '/practice-test/speaking', cls: 'acc-orange' },
  { prefix: '/resources', cls: 'acc-green' },
  { prefix: '/grammar', cls: 'acc-violet' },
  { prefix: '/games', cls: 'acc-violet' },
  { prefix: '/leaderboard', cls: 'acc-violet' },
  { prefix: '/topics', cls: 'acc-violet' },
  { prefix: '/community/topics', cls: 'acc-violet' },
  { prefix: '/achievements', cls: 'acc-violet' },
  { prefix: '/arena', cls: 'acc-violet' },
  { prefix: '/learn/ipa', cls: 'acc-violet' },
  { prefix: '/challenges', cls: 'acc-amber' },
];

// Strip an optional leading locale segment (/en, /de) so prefixes match across locales.
function accentClassFor(pathname: string): string {
  const p = pathname.replace(/^\/(en|de)(?=\/|$)/, '') || '/';
  const hit = ACCENT_ROUTES.find((r) => p === r.prefix || p.startsWith(r.prefix + '/') || p.startsWith(r.prefix));
  return hit?.cls ?? '';
}

export function MainLayout({ children }: MainLayoutProps) {
  const t = useTranslations('common.ui');
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isBareRoute = BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!isBareRoute) {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    }
  }, [isBareRoute]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // ─── Auth/landing pages: full-screen, no chrome ───
  if (isBareRoute) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)' }}>
        {children}
      </div>
    );
  }

  // ─── Loading state ───
  if (!mounted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)' }}>
        <div className="animate-pulse flex items-center justify-center h-screen">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
            style={{ background: GRADIENT.writing }}>
            D
          </div>
        </div>
      </div>
    );
  }

  const sidebarMl = `${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`;
  const accentClass = accentClassFor(pathname);

  // ─── Normal pages: sidebar + header + bottom tab bar ───
  return (
    <div className={`min-h-screen ${accentClass}`} style={{ backgroundColor: 'var(--theme-bg-body)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      <Header sidebarCollapsed={sidebarCollapsed} onOpenPalette={openPalette} />

      {/* Skip-to-content link for keyboard users (visible on focus only) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:font-semibold"
      >
        {t('skipNav')}
      </a>

      <main
        id="main-content"
        className="main-ml pt-16"
        style={{ '--sidebar-ml': sidebarMl } as React.CSSProperties}
      >
        <GuestBanner />
        <div className="min-h-[calc(100vh-4rem)] px-4 md:px-6 lg:px-8 xl:px-10 py-4">
          <Breadcrumb className="mb-3" />
          {children}
        </div>
      </main>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />

      {/* Global command palette — Cmd/Ctrl+K */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
