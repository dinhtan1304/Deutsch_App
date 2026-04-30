'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { IconSearch, IconUser, IconSettings, IconLogOut, IconMessageCircle, IconStar, IconZap } from '@/components/ui/Icons';
import { useIsPremium } from '@/hooks/useSubscription';
import { useXp } from '@/hooks/useXp';
import { useDashboardStats } from '@/hooks/useDashboard';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { FeedbackModal } from './FeedbackModal';
import { NotificationDrawer } from './NotificationDrawer';
import { useUnreadCount, notifKeys } from '@/hooks/useNotifications';
import { STATUS, ACCENT, GRADIENT } from '@/lib/tokens';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onOpenPalette: () => void;
}

export function Header({ sidebarCollapsed, onOpenPalette }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isPremium = useIsPremium();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const qc = useQueryClient();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: xpInfo } = useXp();
  const { data: stats } = useDashboardStats();
  const streak = stats?.streak ?? 0;

  const toggleNotifs = useCallback(() => {
    setShowNotifs(prev => {
      if (!prev) qc.invalidateQueries({ queryKey: notifKeys.all });
      return !prev;
    });
  }, [qc]);

  // Close user menu on Escape key
  useEffect(() => {
    if (!showUserMenu) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showUserMenu]);

  return (
    <>
    <header
      className="header-left fixed top-0 right-0 h-16 z-30 backdrop-blur-xl border-b flex items-center justify-between px-6"
      style={{
        '--sidebar-ml': `${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
        backgroundColor: 'color-mix(in srgb, var(--theme-bg-card) 85%, transparent)',
        borderColor: 'var(--theme-border)',
      } as React.CSSProperties}
    >
      {/* Search trigger — opens command palette (Ctrl/Cmd+K) */}
      <button
        type="button"
        onClick={onOpenPalette}
        className="flex-1 max-w-md flex items-center gap-2 pl-3 pr-2 py-2 rounded-md border text-left transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-secondary)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
        aria-label="Mở command palette"
      >
        <IconSearch size={16} />
        <span className="flex-1 text-body">Tìm kiếm, điều hướng, dịch câu...</span>
        <kbd
          className="shrink-0 rounded-sm px-1.5 py-0.5 text-caption font-semibold"
          style={{ backgroundColor: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-muted)' }}
        >
          Ctrl+K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* Streak pill */}
        {isAuthenticated && streak > 0 && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-body font-bold select-none"
            style={{ background: `${ACCENT.games}1F`, color: ACCENT.games }}
            title={`Streak: ${streak} ngày liên tiếp`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={ACCENT.games} stroke="none">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            {streak}
          </div>
        )}

        {/* Notification bell */}
        {isAuthenticated && (
          <button
            onClick={toggleNotifs}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
            style={{ color: 'var(--theme-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)'; e.currentTarget.style.color = STATUS.info; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--theme-text-muted)'; }}
            title="Thông báo"
            aria-label="Thông báo"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{
                  background: STATUS.danger,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  boxShadow: `0 2px 6px ${STATUS.danger}66`,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* User menu */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl
                hover:bg-(--theme-bg-secondary) transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-body"
                style={{ background: GRADIENT.writing }}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              {!sidebarCollapsed && (
                <span className="hidden md:block text-body font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                  {user?.name}
                </span>
              )}
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl border py-1.5 z-50"
                  style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
                >
                  <div className="px-4 py-2.5 mb-1" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <p className="font-semibold text-body" style={{ color: 'var(--theme-text-primary)' }}>
                      {user?.name}
                    </p>
                    <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>

                  {/* XP row */}
                  {xpInfo && (
                    <div
                      className="flex items-center gap-2.5 px-4 py-2 text-body"
                      style={{ color: 'var(--theme-text-secondary)' }}
                      title={`${xpInfo.xp} XP · Lv.${xpInfo.level} ${xpInfo.nameVi}`}
                    >
                      <IconZap size={15} />
                      <span className="font-semibold">{xpInfo.xp.toLocaleString('vi-VN')} XP</span>
                      <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                        · Lv.{xpInfo.level} {xpInfo.nameVi}
                      </span>
                    </div>
                  )}

                  <div className="my-1" style={{ borderTop: '1px solid var(--theme-border)' }} />

                  {[
                    { href: '/profile', icon: IconUser, label: 'Hồ sơ' },
                    { href: '/settings', icon: IconSettings, label: 'Cài đặt' },
                  ].map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-4 py-2 text-body transition-colors"
                        style={{ color: 'var(--theme-text-secondary)' }}
                        onClick={() => setShowUserMenu(false)}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                      >
                        <ItemIcon size={15} />
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* Feedback */}
                  <button
                    role="menuitem"
                    onClick={() => { setShowUserMenu(false); setShowFeedback(true); }}
                    className="flex items-center gap-2.5 px-4 py-2 text-body w-full text-left transition-colors"
                    style={{ color: 'var(--theme-text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <IconMessageCircle size={15} />
                    Phản hồi & Báo lỗi
                  </button>

                  {!isPremium && (
                    <Link
                      href="/pricing"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2 text-body font-semibold transition-colors"
                      style={{ color: ACCENT.xp }}
                      onClick={() => setShowUserMenu(false)}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${ACCENT.xp}14`)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <IconStar size={15} />
                      Nâng cấp Premium
                    </Link>
                  )}

                  <div className="my-1" style={{ borderTop: '1px solid var(--theme-border)' }} />

                  <button
                    role="menuitem"
                    onClick={() => { logout(); setShowUserMenu(false); router.push('/'); }}
                    className="flex items-center gap-2.5 px-4 py-2 text-body w-full text-left transition-colors"
                    style={{ color: STATUS.danger }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${STATUS.danger}14`)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <IconLogOut size={15} />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl text-body font-medium transition-colors
                hover:bg-(--theme-bg-secondary)"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-xl text-body font-semibold text-white transition-all
                hover:shadow-md hover:-translate-y-0.5"
              style={{ background: GRADIENT.brand }}
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>

    {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    <NotificationDrawer open={showNotifs} onClose={() => setShowNotifs(false)} />
    </>
  );
}
