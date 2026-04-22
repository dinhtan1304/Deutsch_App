'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';
import { Breadcrumb } from '@/components/ui';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'deutschmeister-sidebar-collapsed';

// Routes that should render WITHOUT sidebar/header (full-screen)
const BARE_ROUTES = ['/auth/login', '/auth/register', '/auth', '/', '/landing', '/admin', '/onboarding', '/privacy', '/terms', '/pricing'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isBareRoute = BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  useEffect(() => {
    setMounted(true);
    if (!isBareRoute) {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    }
  }, [isBareRoute]);

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
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
            D
          </div>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  const sidebarMl = `${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`;

  // ─── Normal pages: sidebar + header + bottom tab bar ───
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      <Header sidebarCollapsed={sidebarCollapsed} />

      <main
        className="main-ml pt-16"
        style={{ '--sidebar-ml': sidebarMl } as React.CSSProperties}
      >
        <div className="min-h-[calc(100vh-4rem)] px-4 md:px-6 lg:px-8 xl:px-10 py-4">
          <Breadcrumb className="mb-3" />
          {children}
        </div>
      </main>

      {/* Mobile overlay for sidebar (when sidebar is open via toggle) */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
