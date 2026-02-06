'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconHome, IconBook, IconNotebook, IconLayers, IconGamepad,
  IconPenLine, IconGraduationCap, IconRefresh, IconSettings,
  IconZap, IconCards, IconTimer, IconPencil, IconList, IconBrain,
  IconChevronRight, IconChevronLeft,
} from '@/components/ui/Icons';

// ============================================
// Navigation Items
// ============================================
interface NavItem {
  label: string;
  labelVi: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  badge?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    labelVi: 'Trang chủ',
    icon: IconHome,
    href: '/',
  },
  {
    label: 'Dictionary',
    labelVi: 'Từ điển',
    icon: IconBook,
    href: '/words',
  },
  {
    label: 'Word Bank',
    labelVi: 'Sổ từ vựng',
    icon: IconNotebook,
    href: '/word-bank',
    children: [
      { label: 'All Words', labelVi: 'Tất cả từ', icon: IconList, href: '/word-bank' },
      { label: 'SRS Review', labelVi: 'Ôn tập SRS', icon: IconBrain, href: '/word-bank/review' },
    ],
  },
  {
    label: 'Topics',
    labelVi: 'Chủ đề A1',
    icon: IconLayers,
    href: '/topics',
  },
  {
    label: 'Games',
    labelVi: 'Trò chơi',
    icon: IconGamepad,
    href: '/games',
    children: [
      { label: 'Quick Quiz', labelVi: 'Trắc nghiệm', icon: IconZap, href: '/games/quick-quiz' },
      { label: 'Flashcards', labelVi: 'Thẻ ghi nhớ', icon: IconCards, href: '/games/flashcards' },
      { label: 'Fill Blank', labelVi: 'Điền từ', icon: IconPencil, href: '/games/fill-blank' },
      { label: 'Timed Challenge', labelVi: 'Thử thách', icon: IconTimer, href: '/games/timed-challenge' },
    ],
  },
  {
    label: 'Grammar',
    labelVi: 'Ngữ pháp',
    icon: IconPenLine,
    href: '/grammar',
  },
  {
    label: 'Test',
    labelVi: 'Luyện thi',
    icon: IconGraduationCap,
    href: '/practice-test',
    children: [
      { label: 'Writing', labelVi: 'Luyện viết', icon: IconPenLine, href: '/practice-test/writing' },
    ],
  },
  {
    label: 'Review',
    labelVi: 'Ôn tập từ điển',
    icon: IconRefresh,
    href: '/review',
  },
  {
    label: 'Settings',
    labelVi: 'Cài đặt',
    icon: IconSettings,
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
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/word-bank' && pathname === '/word-bank') return true;
    if (href === '/word-bank/review' && pathname === '/word-bank/review') return true;
    if (href !== '/word-bank') return pathname.startsWith(href);
    return false;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col
        transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]
        ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}
        border-r`}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
      }}
    >
      {/* ─── Logo ─── */}
      <div className="h-16 flex items-center gap-3 px-5 shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg font-black text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
        >
          D
        </div>
        <span
          className={`font-bold text-[15px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300
            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
          style={{ color: 'var(--theme-text-primary)' }}
        >
          Deutschmeister
        </span>
      </div>

      {/* ─── Toggle ─── */}
      <button
        onClick={onToggle}
        className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full border
          flex items-center justify-center shadow-sm
          hover:scale-110 active:scale-95 transition-all duration-200 z-50"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
      >
        {isCollapsed
          ? <IconChevronRight size={14} />
          : <IconChevronLeft size={14} />}
      </button>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const expanded = expandedItems.has(item.href);

            return (
              <li key={item.href}>
                {item.children ? (
                  /* ── Parent with children ── */
                  <>
                    <button
                      onClick={() => !isCollapsed && toggleExpand(item.href)}
                      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200 outline-none
                        ${active
                          ? 'text-blue-500'
                          : 'hover:bg-[var(--theme-bg-secondary)]'
                        }`}
                      style={{ color: active ? undefined : 'var(--theme-text-secondary)' }}
                      title={isCollapsed ? item.labelVi : undefined}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all"
                          style={{ background: 'linear-gradient(180deg, #3B82F6, #8B5CF6)' }}
                        />
                      )}

                      <span className={`shrink-0 w-5 h-5 flex items-center justify-center transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                        <Icon size={20} />
                      </span>

                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left text-[13.5px] font-medium truncate min-w-0">{item.labelVi}</span>
                          <span className={`shrink-0 w-3.5 h-3.5 flex items-center justify-center transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
                            <IconChevronRight size={14} />
                          </span>
                        </>
                      )}
                    </button>

                    {/* Children */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]
                        ${!isCollapsed && expanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <ul className="mt-0.5 ml-5 pl-3 space-y-0.5"
                        style={{ borderLeft: '1.5px solid var(--theme-border)' }}
                      >
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]
                                  transition-all duration-200
                                  ${childActive
                                    ? 'text-blue-500 font-semibold bg-blue-500/8'
                                    : 'hover:bg-[var(--theme-bg-secondary)]'
                                  }`}
                                style={{ color: childActive ? undefined : 'var(--theme-text-muted)' }}
                              >
                              <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                                <ChildIcon size={16} />
                              </span>
                                <span className="min-w-0 truncate">{child.labelVi}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                ) : (
                  /* ── Single item ── */
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${active
                        ? 'text-blue-500'
                        : 'hover:bg-[var(--theme-bg-secondary)]'
                      }`}
                    style={{ color: active ? undefined : 'var(--theme-text-secondary)' }}
                    title={isCollapsed ? item.labelVi : undefined}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: 'linear-gradient(180deg, #3B82F6, #8B5CF6)' }}
                      />
                    )}
                    <span className={`shrink-0 w-5 h-5 flex items-center justify-center transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                      <Icon size={20} />
                    </span>
                    {!isCollapsed && (
                      <span className="text-[13.5px] font-medium truncate min-w-0">{item.labelVi}</span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ─── Footer ─── */}
      {!isCollapsed && (
        <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <div className="text-[11px] text-center" style={{ color: 'var(--theme-text-muted)' }}>
            v1.0.0 • Made with Yuii ❤️
          </div>
        </div>
      )}
    </aside>
  );
}