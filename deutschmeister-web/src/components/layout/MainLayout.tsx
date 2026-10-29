'use client';

import { ReactNode, useCallback, useState, useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';
import { GuestBanner } from './GuestBanner';
import { VerifyEmailBanner } from './VerifyEmailBanner';
import { Breadcrumb } from '@/components/ui';
import { useIsAuthenticated } from '@/stores/authStore';

const CommandPalette = dynamic(() => import('./CommandPalette').then((mod) => mod.CommandPalette), { ssr: false });
const FeedbackChatWidget = dynamic(() => import('./FeedbackChatWidget').then((mod) => mod.FeedbackChatWidget), { ssr: false });

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
  { prefix: '/practice-test/pronunciation', cls: 'acc-pink' },
  { prefix: '/practice-test/speaking-rooms', cls: 'acc-pink' },
  { prefix: '/practice-test/speaking', cls: 'acc-orange' },
  { prefix: '/practice-test/roleplay', cls: 'acc-orange' },
  { prefix: '/resources', cls: 'acc-green' },
  { prefix: '/grammar', cls: 'acc-violet' },
  { prefix: '/games', cls: 'acc-violet' },
  { prefix: '/leaderboard', cls: 'acc-violet' },
  { prefix: '/topics', cls: 'acc-violet' },
  { prefix: '/my-topics', cls: 'acc-violet' },
  { prefix: '/community/topics', cls: 'acc-violet' },
  { prefix: '/achievements', cls: 'acc-violet' },
  { prefix: '/arena', cls: 'acc-violet' },
  { prefix: '/profile/subscription', cls: 'acc-violet' },
  { prefix: '/learn/ipa', cls: 'acc-violet' },
  { prefix: '/challenges', cls: 'acc-amber' },
];

// Strip an optional leading locale segment (/en, /de) so prefixes match across locales.
function accentClassFor(pathname: string): string {
  const p = pathname.replace(/^\/(vi|en|de)(?=\/|$)/, '') || '/';
  const hit = ACCENT_ROUTES.find((r) => p === r.prefix || p.startsWith(r.prefix + '/') || p.startsWith(r.prefix));
  return hit?.cls ?? '';
}

export function MainLayout({ children }: MainLayoutProps) {
  const t = useTranslations('common.ui');
  const isAuthenticated = useIsAuthenticated();
  const pathname = usePathname();
  // Normalize static prerender paths and browser paths identically.
  const localelessPath = pathname.replace(/^\/(vi|en|de)(?=\/|$)/, '') || '/';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isBareRoute = BARE_ROUTES.some(
    (route) => localelessPath === route || localelessPath.startsWith(route + '/')
  );

  useEffect(() => {
    if (!isBareRoute) {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved !== null) {
        // Deliberate: the server cannot read localStorage, so the preference has
        // to be applied after mount. Reading it in a lazy initialiser instead
        // would make the server and client disagree on the first render — the
        // hydration mismatch the removed mount gate was papering over.
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [setSidebarCollapsed]);

  const openPalette = useCallback(() => setPaletteOpen(true), [setPaletteOpen]);
  const closePalette = useCallback(() => setPaletteOpen(false), [setPaletteOpen]);

  // ─── Auth/landing pages: full-screen, no chrome ───
  if (isBareRoute) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)' }}>
        {children}
      </div>
    );
  }

  // No mount gate here, deliberately.
  //
  // This used to return a pulsing splash until `mounted` flipped in an effect —
  // and effects never run on the server, so every non-bare route served that
  // splash as its entire HTML. Not a topic-page problem or a word-page problem:
  // the whole app shipped a loading spinner to crawlers, which is why adding
  // canonicals, metadata and server-side data fetching produced no visible
  // content in the markup.
  //
  // The gate existed only so the sidebar's collapsed state could be read from
  // localStorage without a hydration mismatch. That is handled correctly by
  // starting from the same default on both sides and letting the effect above
  // correct it — a collapsed sidebar expands for one frame on load, which is a
  // small price for the site being readable at all. Moving the preference to a
  // cookie would remove even that.
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
        <VerifyEmailBanner />
        {/* Phones also subtract the BottomTabBar spacer (64px + safe area),
            otherwise every short page scrolls by that much */}
        <div className="min-h-[calc(100dvh-4rem-64px-env(safe-area-inset-bottom))] md:min-h-[calc(100dvh-4rem)] px-4 md:px-6 lg:px-8 xl:px-10 py-4">
          <Breadcrumb className="mb-3" />
          {children}
        </div>
      </main>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />

      {/* Global command palette — Cmd/Ctrl+K */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />

      {/* Floating support / feedback chat — signed-in users only */}
      <FeedbackChatWidget enabled={isAuthenticated} />
    </div>
  );
}
