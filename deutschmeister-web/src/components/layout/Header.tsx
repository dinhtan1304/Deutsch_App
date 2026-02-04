'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

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
      router.push(`/dictionary?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 transition-all duration-300
        ${sidebarCollapsed ? 'left-16' : 'left-64'}
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800
        flex items-center justify-between px-6`}
      style={{ backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm từ vựng..."
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 dark:border-gray-700
              bg-gray-50 dark:bg-gray-800 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all"
            style={{ 
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-primary)',
            }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-gray-400">↵</span>
          </button>
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Quick actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/games"
            className="px-3 py-1.5 rounded-lg text-sm font-medium
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            🎮 Chơi game
          </Link>
          <Link
            href="/review"
            className="px-3 py-1.5 rounded-lg text-sm font-medium
              bg-green-50 dark:bg-green-900/20 text-green-600
              hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            🧠 Ôn tập
          </Link>
        </div>

        {/* User menu */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-500
                flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              {!sidebarCollapsed && (
                <span className="hidden md:block text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                  {user?.name}
                </span>
              )}
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border
                    py-2 z-50"
                  style={{
                    backgroundColor: 'var(--theme-bg-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                    <p className="font-medium text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ color: 'var(--theme-text-secondary)' }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    👤 Hồ sơ
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ color: 'var(--theme-text-secondary)' }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    ⚙️ Cài đặt
                  </Link>

                  <div className="border-t my-1" style={{ borderColor: 'var(--theme-border)' }} />

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      router.push('/');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left
                      text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl text-sm font-medium
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white
                bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}