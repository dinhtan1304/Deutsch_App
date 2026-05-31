'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { IconChevronRight, IconChevronLeft } from '@/components/ui/Icons';
import { useXp } from '@/hooks/useXp';
import { useAuthUser, useIsAuthenticated, useAuthBootstrap } from '@/stores/authStore';
import { useSRSStats } from '@/hooks/usePersonalWords';
import { useProgressStats } from '@/hooks/useProgress';
import { PremiumLockIcon } from '@/components/subscription/UpsellTrigger';
import { BetaBadge } from '@/components/ui/BetaBadge';
import { PRIMARY_NAV, PREMIUM_HREFS, AUTH_HREFS, NAV_FLAT, type NavItem } from '@/config/navigation';
import { STATUS, ACCENT, GRADIENT } from '@/lib/tokens';

// Widths (px) — exported for MainLayout & Header
export const SIDEBAR_WIDTH = 232;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function SidebarComponent({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tUi = useTranslations('common.ui');
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const bootstrap = useAuthBootstrap();
  const { data: xpQuery } = useXp(isAuthenticated && !bootstrap?.xp);
  const xpInfo = bootstrap?.xp ?? xpQuery;
  const { data: srsStats } = useSRSStats(isAuthenticated);
  const { data: progressStats } = useProgressStats(isAuthenticated);
  const srsDue = srsStats?.due ?? 0;
  const builtInDue = progressStats?.due ?? 0;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<{ key: string; top: number } | null>(null);

  // Auto-expand parent of active child on route change
  useEffect(() => {
    NAV_FLAT.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        setExpandedItems(prev => new Set(prev).add(item.key));
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

  const toggleExpand = useCallback((key: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const isActive = useCallback((href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  }, [pathname]);

  // A parent is visually active if its href matches, OR if any child href matches
  const isItemActive = useCallback((item: NavItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(c => isActive(c.href)) ?? false;
  }, [isActive]);

  const showTooltip = useCallback((key: string, el: HTMLElement) => {
    if (!isCollapsed) return;
    const rect = el.getBoundingClientRect();
    setTooltip({ key, top: rect.top + rect.height / 2 });
  }, [isCollapsed]);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Badge counts by nav badge key
  const badgeCount = (badge?: NavItem['badge']): number => {
    if (badge === 'srs-due') return srsDue;
    if (badge === 'builtin-due') return builtInDue;
    return 0;
  };

  const w = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  // ─── Render a single nav item (parent or leaf) ───
  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isItemActive(item);
    const expanded = effectiveExpandedItems.has(item.key);
    const badge = badgeCount(item.badge);

    const hasChildren = Boolean(item.children?.length);

    return (
      <li key={item.key} className="relative">
        {hasChildren ? (
          <>
            {isCollapsed ? (
              <Link
                href={item.href}
                className="sb-nav-link group relative flex items-center justify-center py-2.5 rounded-xl"
                data-active={active ? 'true' : 'false'}
                style={{
                  color: active ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
                  backgroundColor: active ? 'var(--theme-bg-card)' : undefined,
                }}
                onMouseEnter={e => showTooltip(item.key, e.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                {active && <ActiveBar />}
                <IconWrap active={active}><Icon size={20} /></IconWrap>
                {hasChildAnyBadge(item, badgeCount) && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full" style={{ background: STATUS.danger }} />
                )}
              </Link>
            ) : (
              <button
                onClick={() => toggleExpand(item.key)}
                className="sb-nav-link group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl outline-none"
                data-active={active ? 'true' : 'false'}
                style={{
                  color: active ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
                  backgroundColor: active ? 'var(--theme-bg-card)' : undefined,
                }}
              >
                {active && <ActiveBar />}
                <IconWrap active={active}><Icon size={20} /></IconWrap>
                <span className="flex-1 text-left text-[13.5px] font-medium whitespace-nowrap">{tNav(item.labelKey)}</span>
                <span
                  className="shrink-0 w-3.5 h-3.5 flex items-center justify-center"
                  style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .25s cubic-bezier(.4,0,.2,1)' }}
                >
                  <IconChevronRight size={14} />
                </span>
              </button>
            )}

            {/* Tooltip — collapsed hover (parent with children) */}
            {tooltip?.key === item.key && (
              <div
                className="fixed z-50 px-3 py-2 rounded-xl shadow-lg text-body font-medium whitespace-nowrap pointer-events-none"
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
                {tNav(item.labelKey)}
                <div className="mt-1.5 pt-1.5 space-y-0.5" style={{ borderTop: '1px solid var(--theme-border)' }}>
                  {item.children!.map(c => (
                    <div key={c.key} className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{tNav(c.labelKey)}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Children submenu — display swap + GPU-accelerated transform animation (no layout thrash) */}
            <div
              style={{
                display: !isCollapsed && expanded ? 'block' : 'none',
                overflow: 'hidden',
                animation: !isCollapsed && expanded ? 'sbSubmenuIn .2s ease-out' : undefined,
              }}
            >
              <ul className="mt-0.5 ml-5 pl-3 space-y-0.5" style={{ borderLeft: '1.5px solid var(--theme-border)' }}>
                {item.children!.map(child => {
                  const ChildIcon = child.icon;
                  const childActive = isActive(child.href);
                  const childBadge = badgeCount(child.badge);
                  return (
                    <li key={child.key}>
                      <Link
                        href={child.href}
                        aria-current={childActive ? 'page' : undefined}
                        className="sb-nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-body"
                        data-active={childActive ? 'true' : 'false'}
                        style={{
                          color: childActive ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
                          fontWeight: childActive ? 600 : 400,
                          backgroundColor: childActive ? 'var(--theme-bg-card)' : undefined,
                        }}
                      >
                        <span className="shrink-0 w-4 h-4 flex items-center justify-center"><ChildIcon size={16} /></span>
                        <span className="min-w-0 truncate flex-1">{tNav(child.labelKey)}</span>
                        {AUTH_HREFS.has(child.href) && !isAuthenticated ? (
                          <LockIcon />
                        ) : (
                          PREMIUM_HREFS.has(child.href) && <PremiumLockIcon size={12} />
                        )}
                        {child.beta && <BetaBadge size="sm" />}
                        {childBadge > 0 && (
                          <span className="shrink-0 text-caption font-bold px-1.5 py-0.5 rounded-full leading-none text-white text-center"
                            style={{ background: STATUS.danger, minWidth: 18 }}>
                            {childBadge > 99 ? '99+' : childBadge}
                          </span>
                        )}
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
              aria-current={active ? 'page' : undefined}
              aria-label={isCollapsed ? tNav(item.labelKey) : undefined}
              className={`sb-nav-link group relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl`}
              data-active={active ? 'true' : 'false'}
              style={{
                color: active ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
                backgroundColor: active ? 'var(--theme-bg-card)' : undefined,
              }}
              onMouseEnter={e => showTooltip(item.key, e.currentTarget)}
              onMouseLeave={hideTooltip}
            >
              {active && <ActiveBar />}
              <IconWrap active={active}><Icon size={20} /></IconWrap>
              {!isCollapsed && (
                <span className="flex-1 text-[13.5px] font-medium whitespace-nowrap">{tNav(item.labelKey)}</span>
              )}
              {!isCollapsed && AUTH_HREFS.has(item.href) && !isAuthenticated && <LockIcon />}
              {!isCollapsed && (isAuthenticated || !AUTH_HREFS.has(item.href)) && PREMIUM_HREFS.has(item.href) && <PremiumLockIcon size={12} />}
              {!isCollapsed && item.beta && <BetaBadge size="sm" />}
              {badge > 0 && (
                isCollapsed ? (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full" style={{ background: STATUS.danger }} />
                ) : (
                  <span className="shrink-0 text-caption font-bold px-1.5 py-0.5 rounded-full leading-none text-white text-center"
                    style={{ background: STATUS.danger, minWidth: 18 }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )
              )}
            </Link>

            {/* Tooltip — collapsed hover (single) */}
            {tooltip?.key === item.key && (
              <div
                className="fixed z-60 px-3 py-1.5 rounded-lg shadow-lg text-body font-medium whitespace-nowrap pointer-events-none"
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
                {tNav(item.labelKey)}
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
        backgroundColor: 'var(--theme-bg-body)',
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
        .sb-nav-link { transition: background-color .2s, color .2s; }
        .sb-nav-link:hover:not([data-active="true"]) { background-color: var(--theme-bg-secondary); }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translate(-4px, -50%); }
          to { opacity: 1; transform: translate(0, -50%); }
        }
        @keyframes sbSubmenuIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
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
        <Image src="/logo-48.png" width={36} height={36} alt="Deutschmeister" className="rounded-xl shrink-0" priority />
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
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map(item => renderNavItem(item))}
        </ul>
      </nav>

      {/* ─── Premium CTA ─── */}
      {user && (
        <div className="px-3 pb-1 shrink-0">
          {(user.subscription?.plan === 'premium' || user.subscription?.plan === 'lifetime') && user.subscription?.status === 'active' ? (
            <Link
              href="/profile/subscription"
              className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors"
              style={{ color: ACCENT.premium, backgroundColor: `${ACCENT.premium}14` }}
            >
              {!isCollapsed && <span>{user.subscription.plan === 'lifetime' ? 'Lifetime' : 'Premium'}</span>}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT.premium} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ background: GRADIENT.writing }}
            >
              {!isCollapsed && <span>{tUi('upgradePremium')}</span>}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* ─── XP Bar + Footer ─── */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--theme-border)' }}>
        {xpInfo && !isCollapsed && (
          <div className="mb-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold" style={{ color: ACCENT.xp }}>
                Lv.{xpInfo.level} {xpInfo.nameVi}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                {xpInfo.xp} / {xpInfo.nextLevelXp} XP
              </span>
            </div>
            {xpInfo.cefr && (
              <div
                className="text-[10px] font-semibold mb-1"
                title={tUi('levelEstimate')}
                style={{ color: 'var(--theme-text-muted)' }}
              >
                ≈ {xpInfo.cefrLabel}
              </div>
            )}
            <div className="relative h-1.75 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${xpInfo.progress}%`,
                  background: `linear-gradient(90deg, ${ACCENT.xp}, ${STATUS.danger})`,
                  boxShadow: `0 0 6px ${ACCENT.xp}8C`,
                }}
              />
            </div>
            <div className="flex justify-end mt-0.5">
              <span className="text-[9.5px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                {Math.round(xpInfo.progress)}%
              </span>
            </div>
          </div>
        )}
        {xpInfo && isCollapsed && (
          <div className="flex justify-center">
            <div
              title={`Lv.${xpInfo.level} · ${xpInfo.xp} XP`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT.xp}, ${STATUS.danger})` }}
            >
              {xpInfo.level}
            </div>
          </div>
        )}
        {!isCollapsed && (
          <div className="text-caption text-center whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
            v1.0.0 · Made with Yuii ❤️
          </div>
        )}
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);

// ─── Helpers ───
function hasChildAnyBadge(item: NavItem, count: (b?: NavItem['badge']) => number): boolean {
  return item.children?.some(c => count(c.badge) > 0) ?? false;
}

function ActiveBar() {
  return (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
      style={{ background: 'var(--accent)' }}
    />
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      style={{ color: 'var(--theme-text-muted)', opacity: 0.6, flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconWrap({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className="shrink-0 w-5 h-5 flex items-center justify-center"
      style={{
        transform: active ? 'scale(1.1)' : undefined,
        transition: 'transform .2s, color .2s',
        color: active ? 'var(--accent)' : undefined,
      }}
    >
      {children}
    </span>
  );
}
