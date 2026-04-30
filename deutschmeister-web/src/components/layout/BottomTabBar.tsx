'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ACCENT } from '@/lib/tokens';
import { PRIMARY_NAV, type NavItem } from '@/config/navigation';

/**
 * Mobile-viewport navigation. Renders the 5 top-level PRIMARY_NAV items flat —
 * children of each are not shown here, accessible via their hub page instead.
 * Desktop Sidebar renders the same PRIMARY_NAV with expandable children,
 * so taxonomy stays 1:1 across viewports.
 */

function isItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (pathname.startsWith(item.href + '/')) return true;
  return item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/')) ?? false;
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <>
      {/* spacer prevents content from being hidden behind the bar */}
      <div aria-hidden="true" className="md:hidden" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
      <nav
        aria-label="Navigation chính"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch" style={{ height: 64 }}>
          {PRIMARY_NAV.map(item => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item);
            const color = active ? ACCENT.brand : 'var(--theme-text-muted)';
            return (
              <Link
                key={item.key}
                href={item.href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color }}
                aria-current={active ? 'page' : undefined}
              >
                <span className="transition-transform" style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}>
                  <Icon size={22} />
                </span>
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 w-8 h-0.5 rounded-full"
                    style={{ background: ACCENT.brand }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
