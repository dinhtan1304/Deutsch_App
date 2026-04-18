'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { IconSearch, IconGamepad, IconBrain, IconUser, IconSettings, IconLogOut, IconMessageCircle, IconStar } from '@/components/ui/Icons';
import { useIsPremium } from '@/hooks/useSubscription';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { FeedbackModal } from './FeedbackModal';
import { NotificationDrawer } from './NotificationDrawer';
import { useUnreadCount, notifKeys } from '@/hooks/useNotifications';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { type TranslateLang } from '@/lib/api/translation';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isPremium = useIsPremium();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [langOverride, setLangOverride] = useState<TranslateLang | undefined>(undefined);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const qc = useQueryClient();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const toggleNotifs = useCallback(() => {
    setShowNotifs(prev => {
      if (!prev) qc.invalidateQueries({ queryKey: notifKeys.all });
      return !prev;
    });
  }, [qc]);

  const { data: translated, isLoading: isTranslating, isPhrase, from: tlFrom, to: tlTo } =
    useAutoTranslate(searchQuery, langOverride);

  const showTranslationDropdown = searchFocused && isPhrase;

  useEffect(() => {
    if (showTranslationDropdown && searchContainerRef.current) {
      const r = searchContainerRef.current.getBoundingClientRect();
      setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
  }, [showTranslationDropdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      router.push(`/words?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const copyTranslation = () => {
    if (translated) navigator.clipboard.writeText(translated);
  };

  const speakTranslation = () => {
    if (!translated) return;
    const utter = new SpeechSynthesisUtterance(translated);
    utter.lang = tlTo === 'de' ? 'de-DE' : 'vi-VN';
    speechSynthesis.speak(utter);
  };

  return (
    <>
    <header
      className="fixed top-0 right-0 h-16 z-30 backdrop-blur-xl border-b flex items-center justify-between px-6"
      style={{
        left: `${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
        backgroundColor: 'color-mix(in srgb, var(--theme-bg-card) 85%, transparent)',
        borderColor: 'var(--theme-border)',
        transition: 'left .3s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Search */}
      <div ref={searchContainerRef} className="flex-1 max-w-md relative">
        <form onSubmit={handleSearch}>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}>
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setLangOverride(undefined); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Tìm từ vựng hoặc dịch câu..."
              className="w-full pl-10 pr-10 py-2 rounded-xl text-sm border
                focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                transition-all duration-200"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md
                text-[11px] font-medium transition-colors"
              style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-tertiary)' }}
            >
              ↵
            </button>
          </div>
        </form>

      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Feedback button */}
        <button
          onClick={() => setShowFeedback(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
          style={{ color: 'var(--theme-text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)'; e.currentTarget.style.color = '#6366F1'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--theme-text-muted)'; }}
          title="Phản hồi & Báo lỗi"
        >
          <IconMessageCircle size={16} />
          <span className="hidden md:inline">Phản hồi</span>
        </button>

        {/* Notification bell */}
        {isAuthenticated && (
          <button
            onClick={toggleNotifs}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
            style={{ color: 'var(--theme-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)'; e.currentTarget.style.color = '#3B82F6'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--theme-text-muted)'; }}
            title="Thông báo"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{
                  background: '#EF4444',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  boxShadow: '0 2px 6px rgba(239,68,68,.4)',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Quick actions */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            href="/games"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
            style={{ color: 'var(--theme-text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
          >
            <IconGamepad size={16} />
            Chơi game
          </Link>
          <Link
            href="/review"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium
              transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,.1), rgba(52,211,153,.06))',
              color: '#10B981',
            }}
          >
            <IconBrain size={16} />
            Ôn tập
          </Link>
        </div>

        {/* User menu */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl
                hover:bg-(--theme-bg-secondary) transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px]"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              {!sidebarCollapsed && (
                <span className="hidden md:block text-[13px] font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                  {user?.name}
                </span>
              )}
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl border py-1.5 z-50"
                  style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
                >
                  <div className="px-4 py-2.5 mb-1" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <p className="font-semibold text-[13px]" style={{ color: 'var(--theme-text-primary)' }}>
                      {user?.name}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>

                  {[
                    { href: '/profile', icon: IconUser, label: 'Hồ sơ' },
                    { href: '/settings', icon: IconSettings, label: 'Cài đặt' },
                  ].map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors"
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

                  {!isPremium && (
                    <Link
                      href="/pricing"
                      className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-semibold transition-colors"
                      style={{ color: '#F59E0B' }}
                      onClick={() => setShowUserMenu(false)}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(245,158,11,.08)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <IconStar size={15} />
                      Nâng cấp Premium
                    </Link>
                  )}

                  <div className="my-1" style={{ borderTop: '1px solid var(--theme-border)' }} />

                  <button
                    onClick={() => { logout(); setShowUserMenu(false); router.push('/'); }}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] w-full text-left transition-colors"
                    style={{ color: '#EF4444' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,.08)')}
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
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-colors
                hover:bg-(--theme-bg-secondary)"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all
                hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>

    {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    <NotificationDrawer open={showNotifs} onClose={() => setShowNotifs(false)} />

    {/* Translation dropdown — rendered outside <header> to avoid clip */}
    {showTranslationDropdown && dropdownRect && (
      <div
        className="rounded-xl border shadow-2xl p-3"
        style={{
          position: 'fixed',
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
          zIndex: 9999,
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          borderLeft: '3px solid #3B82F6',
        }}
      >
        {/* Direction row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
            {tlFrom === 'vi' ? '🇻🇳 VI' : '🇩🇪 DE'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            {tlTo === 'de' ? '🇩🇪 DE' : '🇻🇳 VI'}
          </span>
          <button
            onMouseDown={e => { e.preventDefault(); setLangOverride(prev => (prev ?? tlFrom) === 'vi' ? 'de' : 'vi'); }}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md transition-all"
            style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}
          >
            ⇄ Đổi chiều
          </button>
        </div>

        {/* Result */}
        {isTranslating ? (
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>Đang dịch...</span>
          </div>
        ) : translated ? (
          <div>
            <p className="text-[13px] font-semibold leading-snug mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              {translated}
            </p>
            <div className="flex items-center gap-1.5">
              <button onMouseDown={e => { e.preventDefault(); copyTranslation(); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button onMouseDown={e => { e.preventDefault(); speakTranslation(); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                Phát âm
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[11px]" style={{ color: '#EF4444' }}>Không dịch được. Thử lại sau.</p>
        )}

        <p className="text-[10px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
          Nhấn ↵ để tìm trong từ điển
        </p>
      </div>
    )}
    </>
  );
}