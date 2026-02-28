'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconHome, IconBook, IconNotebook, IconLayers, IconGamepad,
  IconPenLine, IconGraduationCap, IconRefresh, IconSettings,
  IconZap, IconCards, IconTimer, IconPencil, IconList, IconBrain, IconTarget,
  IconChevronRight, IconChevronLeft, IconBookOpen,
  IconHeadphones, IconSpellCheck, IconLink, IconMic,
} from '@/components/ui/Icons';

// ============================================
// Navigation Data
// ============================================
interface NavItem {
  label: string;
  labelVi: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  children?: NavItem[];
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Home', labelVi: 'Trang chủ', icon: IconHome, href: '/dashboard' },
    ],
  },
  {
    label: 'Từ vựng',
    items: [
      { label: 'Dictionary', labelVi: 'Từ điển', icon: IconBook, href: '/words' },
      {
        label: 'Word Bank', labelVi: 'Sổ từ vựng', icon: IconNotebook, href: '/word-bank',
        children: [
          { label: 'All Words', labelVi: 'Tất cả từ', icon: IconList, href: '/word-bank' },
          { label: 'SRS Review', labelVi: 'Ôn tập SRS', icon: IconBrain, href: '/word-bank/review' },
        ],
      },
      { label: 'Topics', labelVi: 'Chủ đề A1', icon: IconLayers, href: '/topics' },
    ],
  },
  {
    label: 'Trò chơi',
    items: [
      {
        label: 'Games', labelVi: 'Trò chơi', icon: IconGamepad, href: '/games',
        children: [
          { label: 'Quick Quiz', labelVi: 'Trắc nghiệm', icon: IconZap, href: '/games/quick-quiz' },
          { label: 'Gender Quiz', labelVi: 'Der/Die/Das', icon: IconTarget, href: '/games/gender-quiz' },
          { label: 'Flashcards', labelVi: 'Thẻ ghi nhớ', icon: IconCards, href: '/games/flashcards' },
          { label: 'Fill Blank', labelVi: 'Điền từ', icon: IconPencil, href: '/games/fill-blank' },
          { label: 'Timed Challenge', labelVi: 'Thử thách', icon: IconTimer, href: '/games/timed-challenge' },
          { label: 'Word Match', labelVi: 'Ghép từ', icon: IconLink, href: '/games/word-match' },
          { label: 'Listening', labelVi: 'Nghe từ', icon: IconHeadphones, href: '/games/listening' },
          { label: 'Spelling Bee', labelVi: 'Chính tả', icon: IconSpellCheck, href: '/games/spelling' },
        ],
      },
    ],
  },
  {
    label: 'Luyện thi',
    items: [
      { label: 'Grammar', labelVi: 'Ngữ pháp', icon: IconBookOpen, href: '/grammar' },
      {
        label: 'Test', labelVi: 'Luyện thi', icon: IconGraduationCap, href: '/practice-test',
        children: [
          { label: 'Reading', labelVi: 'Luyện đọc', icon: IconBookOpen, href: '/practice-test/reading' },
          { label: 'Reading Exam', labelVi: 'Đọc theo đề', icon: IconBookOpen, href: '/practice-test/reading/exam' },
          { label: 'Listening', labelVi: 'Luyện nghe', icon: IconHeadphones, href: '/practice-test/listening' },
          { label: 'Listening Exam', labelVi: 'Nghe theo đề', icon: IconHeadphones, href: '/practice-test/listening/exam' },
          { label: 'Writing', labelVi: 'Luyện viết', icon: IconPenLine, href: '/practice-test/writing' },
          { label: 'Writing Exam', labelVi: 'Viết theo đề', icon: IconPenLine, href: '/practice-test/writing/exam' },
          { label: 'Speaking', labelVi: 'Luyện nói', icon: IconMic, href: '/practice-test/speaking' },
          { label: 'Speaking Exam', labelVi: 'Nói theo đề', icon: IconMic, href: '/practice-test/speaking/exam' },
        ],
      },
      { label: 'Review', labelVi: 'Ôn tập SM-2', icon: IconRefresh, href: '/review' },
    ],
  },
  {
    items: [
      { label: 'Settings', labelVi: 'Cài đặt', icon: IconSettings, href: '/settings' },
    ],
  },
];

// Flat list for auto-expand logic
const allNavItems = navSections.flatMap(s => s.items);

// Widths (px) — exported for MainLayout & Header
export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

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
  const [tooltip, setTooltip] = useState<{ href: string; top: number } | null>(null);

  // Auto-expand parent of active child on route change
  useEffect(() => {
    allNavItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        setExpandedItems(prev => new Set(prev).add(item.href));
      }
    });
  }, [pathname]);

  const effectiveExpandedItems = isCollapsed ? new Set<string>() : expandedItems;

  // Keyboard shortcut: Ctrl+B / Cmd+B
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onToggle]);

  const toggleExpand = useCallback((href: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href); else next.add(href);
      return next;
    });
  }, []);

  const isActive = useCallback((href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  }, [pathname]);

  const showTooltip = useCallback((href: string, el: HTMLElement) => {
    if (!isCollapsed) return;
    const rect = el.getBoundingClientRect();
    setTooltip({ href, top: rect.top + rect.height / 2 });
  }, [isCollapsed]);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  const w = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  // ─── Render a single nav item (parent or leaf) ───
  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const expanded = effectiveExpandedItems.has(item.href);

    return (
      <li key={item.href} className="relative">
        {item.children ? (
          <>
            {isCollapsed ? (
              <Link
                href={item.href}
                className="group relative flex items-center justify-center py-2.5 rounded-xl"
                style={{
                  color: active ? '#3B82F6' : 'var(--theme-text-secondary)',
                  backgroundColor: active ? 'rgba(59,130,246,.08)' : undefined,
                  transition: 'background-color .2s, color .2s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)'; showTooltip(item.href, e.currentTarget); }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = ''; hideTooltip(); }}
              >
                {active && <ActiveBar />}
                <IconWrap active={active}><Icon size={20} /></IconWrap>
              </Link>
            ) : (
              <button
                onClick={() => toggleExpand(item.href)}
                className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl outline-none"
                style={{
                  color: active ? '#3B82F6' : 'var(--theme-text-secondary)',
                  backgroundColor: active ? 'rgba(59,130,246,.08)' : undefined,
                  transition: 'background-color .2s, color .2s',
                }}
                onMouseEnter={e => !active && (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
                onMouseLeave={e => !active && (e.currentTarget.style.backgroundColor = '')}
              >
                {active && <ActiveBar />}
                <IconWrap active={active}><Icon size={20} /></IconWrap>
                <span className="flex-1 text-left text-[13.5px] font-medium whitespace-nowrap">{item.labelVi}</span>
                <span
                  className="shrink-0 w-3.5 h-3.5 flex items-center justify-center"
                  style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .25s cubic-bezier(.4,0,.2,1)' }}
                >
                  <IconChevronRight size={14} />
                </span>
              </button>
            )}

            {/* Tooltip — collapsed hover (parent with children) */}
            {tooltip?.href === item.href && (
              <div
                className="fixed z-50 px-3 py-2 rounded-xl shadow-lg text-[13px] font-medium whitespace-nowrap pointer-events-none"
                style={{
                  left: `${SIDEBAR_COLLAPSED_WIDTH + 8}px`,
                  top: `${tooltip.top}px`,
                  transform: 'translateY(-50%)',
                  backgroundColor: 'var(--theme-bg-card)',
                  color: 'var(--theme-text-primary)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,.1)',
                  animation: 'tooltipIn .15s ease-out forwards',
                }}
              >
                {item.labelVi}
                <div className="mt-1.5 pt-1.5 space-y-0.5" style={{ borderTop: '1px solid var(--theme-border)' }}>
                  {item.children.map(c => (
                    <div key={c.href} className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{c.labelVi}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Children submenu (animated) */}
            <div
              style={{
                maxHeight: !isCollapsed && expanded ? '480px' : '0',
                opacity: !isCollapsed && expanded ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height .3s cubic-bezier(.4,0,.2,1), opacity .25s',
              }}
            >
              <ul className="mt-0.5 ml-5 pl-3 space-y-0.5" style={{ borderLeft: '1.5px solid var(--theme-border)' }}>
                {item.children.map(child => {
                  const ChildIcon = child.icon;
                  const childActive = isActive(child.href);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]"
                        style={{
                          color: childActive ? '#3B82F6' : 'var(--theme-text-muted)',
                          fontWeight: childActive ? 600 : 400,
                          backgroundColor: childActive ? 'rgba(59,130,246,.08)' : undefined,
                          transition: 'background-color .2s, color .15s',
                        }}
                        onMouseEnter={e => !childActive && (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
                        onMouseLeave={e => !childActive && (e.currentTarget.style.backgroundColor = '')}
                      >
                        <span className="shrink-0 w-4 h-4 flex items-center justify-center"><ChildIcon size={16} /></span>
                        <span className="min-w-0 truncate">{child.labelVi}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link
              href={item.href}
              className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl`}
              style={{
                color: active ? '#3B82F6' : 'var(--theme-text-secondary)',
                backgroundColor: active ? 'rgba(59,130,246,.08)' : undefined,
                transition: 'background-color .2s, color .2s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)'; showTooltip(item.href, e.currentTarget); }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = ''; hideTooltip(); }}
            >
              {active && <ActiveBar />}
              <IconWrap active={active}><Icon size={20} /></IconWrap>
              {!isCollapsed && (
                <span className="text-[13.5px] font-medium whitespace-nowrap">{item.labelVi}</span>
              )}
            </Link>

            {/* Tooltip — collapsed hover (single) */}
            {tooltip?.href === item.href && (
              <div
                className="fixed z-60 px-3 py-1.5 rounded-lg shadow-lg text-[13px] font-medium whitespace-nowrap pointer-events-none"
                style={{
                  left: `${SIDEBAR_COLLAPSED_WIDTH + 8}px`,
                  top: `${tooltip.top}px`,
                  transform: 'translateY(-50%)',
                  backgroundColor: 'var(--theme-bg-card)',
                  color: 'var(--theme-text-primary)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,.1)',
                  animation: 'tooltipIn .15s ease-out forwards',
                }}
              >
                {item.labelVi}
              </div>
            )}
          </>
        )}
      </li>
    );
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col border-r"
      style={{
        width: `${w}px`,
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
        transition: 'width .3s cubic-bezier(.4,0,.2,1)',
        willChange: 'width',
      }}
    >
      {/* ─── Styles ─── */}
      <style>{`
        .sidebar-nav { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .sidebar-nav:hover { scrollbar-color: var(--theme-border) transparent; }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
        .sidebar-nav:hover::-webkit-scrollbar-thumb { background: var(--theme-border); }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translate(-4px, -50%); }
          to { opacity: 1; transform: translate(0, -50%); }
        }
      `}</style>

      {/* ─── Toggle ─── */}
      <button
        onClick={onToggle}
        title={isCollapsed ? 'Mở rộng (Ctrl+B)' : 'Thu gọn (Ctrl+B)'}
        className="absolute z-50 w-7 h-7 rounded-full border flex items-center justify-center shadow-sm"
        style={{
          top: '4.5rem',
          right: '-14px',
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
          transition: 'transform .2s, box-shadow .2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = ''; }}
      >
        {isCollapsed ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
      </button>

      {/* ─── Logo ─── */}
      <div className="h-16 flex items-center gap-3 px-5 shrink-0 overflow-hidden">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg font-black text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
        >
          D
        </div>
        <span
          className="font-bold text-[15px] tracking-tight whitespace-nowrap"
          style={{
            color: 'var(--theme-text-primary)',
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : 'auto',
            transition: 'opacity .2s, width .3s',
            overflow: 'hidden',
          }}
        >
          Deutschmeister
        </span>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="sidebar-nav flex-1 py-2 px-3" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Section divider / label */}
            {section.label && (
              isCollapsed ? (
                /* Collapsed: thin horizontal line */
                sectionIdx > 0 && (
                  <div className="mx-2 my-2" style={{ borderTop: '1px solid var(--theme-border)' }} />
                )
              ) : (
                /* Expanded: labelled section header */
                <div
                  className="px-3 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest select-none"
                  style={{ color: 'var(--theme-text-muted)', letterSpacing: '0.08em' }}
                >
                  {section.label}
                </div>
              )
            )}

            <ul className="space-y-0.5 mb-1">
              {section.items.map(item => renderNavItem(item))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ─── Footer ─── */}
      {!isCollapsed && (
        <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <div className="text-[11px] text-center whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
            v1.0.0 · Made with Yuii ❤️
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================
// Sub-components
// ============================================
function ActiveBar() {
  return (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
      style={{ background: 'linear-gradient(180deg, #3B82F6, #8B5CF6)' }}
    />
  );
}

function IconWrap({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className="shrink-0 w-5 h-5 flex items-center justify-center"
      style={{ transform: active ? 'scale(1.1)' : undefined, transition: 'transform .2s' }}
    >
      {children}
    </span>
  );
}
