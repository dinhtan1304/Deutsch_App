'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================
// Navigation Items
// ============================================
interface NavItem {
  label: string;
  labelVi: string;
  icon: string;
  href: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    labelVi: 'Trang chủ',
    icon: '🏠',
    href: '/',
  },
  {
    label: 'Dictionary',
    labelVi: 'Từ điển',
    icon: '📖',
    href: '/dictionary',
  },
  {
    label: 'Word Bank',
    labelVi: 'Sổ từ vựng',
    icon: '📒',
    href: '/word-bank',
  },
  {
    label: 'Topics',
    labelVi: 'Chủ đề A1',
    icon: '📚',
    href: '/topics',
  },
  {
    label: 'Games',
    labelVi: 'Trò chơi',
    icon: '🎮',
    href: '/games',
    children: [
      { label: 'Quick Quiz', labelVi: 'Trắc nghiệm', icon: '⚡', href: '/games/quick-quiz' },
      { label: 'Flashcards', labelVi: 'Thẻ ghi nhớ', icon: '🃏', href: '/games/flashcards' },
      { label: 'Fill Blank', labelVi: 'Điền từ', icon: '✏️', href: '/games/fill-blank' },
      { label: 'Timed Challenge', labelVi: 'Thử thách', icon: '⏱️', href: '/games/timed-challenge' },
    ],
  },
  {
    label: 'Grammar',
    labelVi: 'Ngữ pháp',
    icon: '📚',
    href: '/grammar',
  },
  {
    label: 'SRS Review',
    labelVi: 'Ôn tập SRS',
    icon: '🧠',
    href: '/srs',
  },
  {
    label: 'Settings',
    labelVi: 'Cài đặt',
    icon: '⚙️',
    href: '/settings',
  },
];

// ============================================
// Sidebar Component
// ============================================
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Auto-expand parent if child is active
  useEffect(() => {
    navItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        setExpandedItems(prev => new Set(prev).add(item.href));
      }
    });
  }, [pathname]);

  const toggleExpand = (href: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        flex flex-col`}
      style={{ backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🇩🇪</span>
            <span className="font-bold text-lg" style={{ color: 'var(--theme-text-primary)' }}>
              Deutschmeister
            </span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/" className="mx-auto">
            <span className="text-2xl">🇩🇪</span>
          </Link>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 shadow-sm
          flex items-center justify-center text-xs hover:bg-gray-50 dark:hover:bg-gray-700
          transition-colors z-50"
        style={{ color: 'var(--theme-text-secondary)' }}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.href}>
              {item.children ? (
                // Parent with children
                <>
                  <button
                    onClick={() => !isCollapsed && toggleExpand(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                      ${isActive(item.href)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    style={{ color: isActive(item.href) ? undefined : 'var(--theme-text-secondary)' }}
                    title={isCollapsed ? item.labelVi : undefined}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium text-sm">{item.labelVi}</span>
                        <span className={`text-xs transition-transform ${expandedItems.has(item.href) ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                      </>
                    )}
                  </button>

                  {/* Children */}
                  {!isCollapsed && expandedItems.has(item.href) && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-1">
                      {item.children.map(child => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                              ${isActive(child.href)
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            style={{ color: isActive(child.href) ? undefined : 'var(--theme-text-secondary)' }}
                          >
                            <span>{child.icon}</span>
                            <span>{child.labelVi}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // Single item
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                    ${isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  style={{ color: isActive(item.href) ? undefined : 'var(--theme-text-secondary)' }}
                  title={isCollapsed ? item.labelVi : undefined}
                >
                  <span className="text-xl shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item.labelVi}</span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-400 text-center">
            v1.0.0 • Made with Yuii ❤️
          </div>
        </div>
      )}
    </aside>
  );
}