/**
 * Unified navigation config — single source of truth for Sidebar (desktop) and
 * BottomTabBar (mobile web). Both render from this array so taxonomy stays 1:1
 * across viewports.
 *
 * Shape:
 *   - 5 top-level items (mobile bottom tab renders these flat)
 *   - Each top-level can have `children` (desktop sidebar expands these)
 *   - Max 2 levels (top + children) to keep sidebar render logic simple
 *
 * Route renames are NOT performed here — hrefs map to existing routes.
 * Future phases may rename routes (e.g. /words → /vocabulary/lookup), but
 * nav config changes and route renames should land separately.
 */

import type { ComponentType } from 'react';
import {
  IconHome, IconBook, IconNotebook, IconLayers, IconGamepad,
  IconPenLine, IconRefresh, IconSettings,
  IconZap, IconBrain, IconTarget, IconBookOpen,
  IconHeadphones, IconMic, IconLink, IconUser, IconStar, IconClock,
  IconTrophy, IconBarChart,
} from '@/components/ui/Icons';

export interface NavItem {
  key: string;
  label: string;                                 // Vietnamese (chrome is VN-first)
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  children?: NavItem[];
  premium?: boolean;                              // show crown icon for free users
  badge?: 'srs-due' | 'builtin-due';              // runtime counts wired in Sidebar
}

// Inline icon for "More" — no existing icon fits
function IconMore({ size = 20 }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

export const PRIMARY_NAV: NavItem[] = [
  {
    key: 'home',
    label: 'Trang chủ',
    href: '/dashboard',
    icon: IconHome,
  },
  {
    key: 'vocabulary',
    label: 'Từ vựng',
    href: '/words',
    icon: IconBook,
    children: [
      { key: 'words',         label: 'Từ điển',      href: '/words',              icon: IconBook },
      { key: 'word-bank',     label: 'Sổ tay',       href: '/word-bank',          icon: IconNotebook },
      { key: 'word-bank-srs', label: 'Ôn SRS',       href: '/word-bank/review',   icon: IconBrain, badge: 'srs-due' },
      { key: 'review-sm2',    label: 'Ôn tập',       href: '/review',             icon: IconRefresh, badge: 'builtin-due' },
      { key: 'topics',        label: 'Chủ đề',       href: '/topics',             icon: IconLayers },
    ],
  },
  {
    key: 'practice',
    label: 'Luyện tập',
    href: '/practice-test',
    icon: IconTarget,
    children: [
      { key: 'grammar',     label: 'Ngữ pháp',    href: '/grammar',                icon: IconBookOpen },
      { key: 'games',       label: 'Trò chơi',    href: '/games',                  icon: IconGamepad },
      { key: 'reading',     label: 'Đọc',         href: '/practice-test/reading',  icon: IconBookOpen, premium: true },
      { key: 'listening',   label: 'Nghe',        href: '/practice-test/listening', icon: IconHeadphones, premium: true },
      { key: 'writing',     label: 'Viết',        href: '/practice-test/writing',  icon: IconPenLine, premium: true },
      { key: 'speaking',    label: 'Nói',         href: '/practice-test/speaking',   icon: IconMic, premium: true },
      { key: 'dictation',   label: 'Chép chính tả', href: '/practice-test/dictation', icon: IconHeadphones },
      { key: 'study-plan',  label: 'Kế hoạch',    href: '/study-plan',               icon: IconTarget },
    ],
  },
  {
    key: 'progress',
    label: 'Tiến độ',
    href: '/profile',
    icon: IconBarChart,
    children: [
      { key: 'profile',       label: 'Hồ sơ',      href: '/profile',       icon: IconUser },
      { key: 'achievements',  label: 'Thành tích', href: '/achievements',  icon: IconTrophy },
      { key: 'leaderboard',   label: 'Xếp hạng',   href: '/leaderboard',   icon: IconZap },
      { key: 'challenges',    label: 'Thử thách',  href: '/challenges',    icon: IconBrain },
      { key: 'history',       label: 'Lịch sử',    href: '/history',       icon: IconClock },
    ],
  },
  {
    key: 'more',
    label: 'Thêm',
    href: '/settings',
    icon: IconMore,
    children: [
      { key: 'settings',   label: 'Cài đặt',   href: '/settings',  icon: IconSettings },
      { key: 'resources',  label: 'Tài nguyên', href: '/resources', icon: IconLink },
      { key: 'pricing',    label: 'Nâng cấp',  href: '/pricing',   icon: IconStar },
    ],
  },
];

/**
 * Flat set of premium-gated hrefs, derived from PRIMARY_NAV tree.
 * Replaces the hardcoded PREMIUM_ROUTES Set that used to live in Sidebar.tsx.
 */
export const PREMIUM_HREFS: ReadonlySet<string> = new Set(
  PRIMARY_NAV.flatMap(item =>
    [item, ...(item.children ?? [])]
      .filter(n => n.premium)
      .map(n => n.href),
  ),
);

/** Flat list of all nav items for auto-expand / search logic */
export const NAV_FLAT: NavItem[] = PRIMARY_NAV.flatMap(item =>
  [item, ...(item.children ?? [])],
);

/**
 * Hrefs that require authentication. Used by Sidebar to show a lock icon and
 * redirect guests to /auth/login?returnTo=<href> instead of the real page.
 */
export const AUTH_HREFS: ReadonlySet<string> = new Set([
  '/dashboard',
  '/word-bank',
  '/word-bank/review',
  '/review',
  '/profile',
  '/favorites',
  '/history',
]);
