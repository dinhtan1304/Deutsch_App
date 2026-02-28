'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { IconSearch, IconGamepad, IconBrain, IconUser, IconSettings, IconLogOut } from '@/components/ui/Icons';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/words?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
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
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm từ vựng..."
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

      {/* Right side */}
      <div className="flex items-center gap-3">
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
  );
}