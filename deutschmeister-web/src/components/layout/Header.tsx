'use client';
// UI_REFRESH_FORCE_SYNC: 2026-05-01_v2

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { IconSearch, IconUser, IconSettings, IconLogOut, IconMessageCircle, IconStar, IconZap, IconDiscord } from '@/components/ui/Icons';
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
        className="header-left fixed top-0 right-0 h-16 z-30 backdrop-blur-xl border-b flex items-center justify-between gap-2 px-3 sm:px-6"
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
          <span className="flex-1 text-body truncate sm:hidden">Tìm kiếm...</span>
          <span className="flex-1 text-body truncate hidden sm:block">Tìm kiếm, điều hướng, dịch câu...</span>
          <kbd
            className="shrink-0 rounded-sm px-1.5 py-0.5 text-caption font-semibold hidden sm:inline-flex"
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
                    className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-[2.5rem] shadow-2xl border p-3 z-50 backdrop-blur-3xl animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{
                      background: 'color-mix(in srgb, var(--theme-bg-card) 96%, transparent)',
                      borderColor: 'var(--theme-border)',
                      boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
                    }}
                  >
                    {/* UI REFRESH TRIGGER: 1.0.1 */}
                    {/* Premium Membership Card */}
                    <div className="relative overflow-hidden rounded-4xl p-5 mb-3 group shadow-sm border border-black/5 dark:border-white/5">
                      {/* Background Aura */}
                      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                        style={{
                          background: isPremium
                            ? GRADIENT.premiumAuraBg
                            : GRADIENT.grayAuraBg
                        }}
                      />

                      <div className="relative z-10 flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl transition-transform group-hover:rotate-6"
                            style={{ background: isPremium ? GRADIENT.brand : 'var(--theme-bg-secondary)' }}>
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          {isPremium && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-amber-500 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-lg">
                              <IconStar size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-base truncate mb-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                            {user?.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${isPremium ? 'bg-indigo-500 text-white' : 'bg-black/5 dark:bg-white/10 text-muted'}`}>
                              {isPremium ? 'Premium' : 'Free Plan'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* XP & Level Gamified Section */}
                    {xpInfo && (
                      <div className="px-5 py-4 mb-3 rounded-[1.8rem] bg-black/2 dark:bg-white/3 border border-black/5 dark:border-white/5">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                              <IconZap size={14} className="animate-pulse" />
                            </div>
                            <span className="text-sm font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                              {xpInfo.xp.toLocaleString('vi-VN')} <span className="opacity-40 text-[10px]">XP</span>
                            </span>
                          </div>
                          <div className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10">
                            <span className="text-[10px] font-black tracking-tighter" style={{ color: 'var(--theme-text-primary)' }}>
                              LEVEL {xpInfo.level}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden p-px">
                          <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                            style={{
                              width: `${Math.min(100, (xpInfo.xp % 1000) / 10)}%`,
                              background: GRADIENT.writingH
                            }} />
                        </div>
                        <p className="text-[9px] mt-2 font-bold opacity-40 uppercase tracking-widest text-center" style={{ color: 'var(--theme-text-primary)' }}>
                          {xpInfo.nameVi}
                        </p>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="space-y-1 px-1">
                      {[
                        { href: '/profile', icon: IconUser, label: 'Hồ sơ cá nhân', color: ACCENT.writing },
                        { href: '/settings', icon: IconSettings, label: 'Thiết lập tài khoản', color: ACCENT.vocab },
                        { href: 'https://discord.gg/NfztBxtxh', icon: IconDiscord, label: 'Tham gia Discord', color: '#5865F2' },
                        { action: 'feedback', icon: IconMessageCircle, label: 'Phản hồi & Báo lỗi', color: ACCENT.emerald },
                      ].map((item, idx) => {
                        const ItemIcon = item.icon;
                        const isAction = 'action' in item;

                        const content = (
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 hover:bg-black/3 dark:hover:bg-white/5 hover:translate-x-1.5 group">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 group-hover:scale-110 transition-all"
                              style={{ color: item.color }}>
                              <ItemIcon size={18} />
                            </div>
                            <span className="text-[13px] font-bold opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ color: 'var(--theme-text-primary)' }}>
                              {item.label}
                            </span>
                          </div>
                        );

                        if (isAction) {
                          return (
                            <button key={idx} onClick={() => { setShowUserMenu(false); setShowFeedback(true); }} className="w-full text-left">
                              {content}
                            </button>
                          );
                        }

                        const isExternal = (item.href as string).startsWith('http');

                        return (
                          <Link
                            key={idx}
                            href={item.href as string}
                            onClick={() => setShowUserMenu(false)}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                          >
                            {content}
                          </Link>
                        );
                      })}

                      <div className="h-px bg-black/5 dark:bg-white/5 my-3 mx-4" />

                      <button
                        onClick={() => { logout(); setShowUserMenu(false); router.push('/'); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full text-left transition-all duration-300 hover:bg-red-500/5 hover:translate-x-1.5 group"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/5 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                          <IconLogOut size={18} />
                        </div>
                        <span className="text-[13px] font-bold text-red-500 opacity-80 group-hover:opacity-100 whitespace-nowrap">
                          Đăng xuất
                        </span>
                      </button>
                    </div>
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
