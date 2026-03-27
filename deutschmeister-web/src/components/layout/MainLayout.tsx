'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'deutschmeister-sidebar-collapsed';

// Routes that should render WITHOUT sidebar/header (full-screen)
const BARE_ROUTES = ['/auth/login', '/auth/register', '/auth', '/', '/landing', '/admin', '/onboarding', '/privacy', '/terms'];

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

  // ─── Auth pages: full-screen, no chrome ───
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

  // ─── Normal pages: sidebar + header ───
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main
        className="transition-all duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="min-h-[calc(100vh-4rem)] px-6 lg:px-8 xl:px-10">
          {children}
        </div>
      </main>

      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}