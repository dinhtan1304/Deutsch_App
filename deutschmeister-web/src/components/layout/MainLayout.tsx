'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'deutschmeister-sidebar-collapsed';

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main
        className="transition-all duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="min-h-[calc(100vh-4rem)]">
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