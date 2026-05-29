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
 *
 * i18n: `labelKey` is a `nav` namespace key. Resolve via
 * `useTranslations('nav')(item.labelKey)` in renderers.
 */

import type { ComponentType } from 'react';
import {
  IconHome, IconBook, IconNotebook, IconLayers, IconGamepad,
  IconPenLine, IconRefresh, IconSettings,
  IconZap, IconBrain, IconTarget, IconBookOpen,
  IconHeadphones, IconMic, IconLink, IconUser, IconStar, IconClock,
  IconTrophy, IconBarChart, IconFlame,
} from '@/components/ui/Icons';
// Constrain labelKey to the actual nav namespace keys. vi is the source of truth
// for shape; en/de mirror these keys (and fall back to vi if missing).
import type navMessagesVi from '../../messages/vi/nav.json';

export type NavLabelKey = keyof typeof navMessagesVi;

export interface NavItem {
  key: string;
  labelKey: NavLabelKey;                          // key into messages/<locale>/nav.json
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  children?: NavItem[];
  premium?: boolean;                              // show crown icon for free users
  beta?: boolean;                                 // show BETA pill in sidebar (expanded only)
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
    labelKey: 'home',
    href: '/dashboard',
    icon: IconHome,
  },
  {
    key: 'vocabulary',
    labelKey: 'vocabulary',
    href: '/words',
    icon: IconBook,
    children: [
      { key: 'words',         labelKey: 'words',           href: '/words',              icon: IconBook },
      { key: 'word-bank',     labelKey: 'wordBank',        href: '/word-bank',          icon: IconNotebook },
      { key: 'word-bank-srs', labelKey: 'wordBankSrs',     href: '/word-bank/review',   icon: IconBrain, badge: 'srs-due' },
      { key: 'review-sm2',    labelKey: 'reviewSm2',       href: '/review',             icon: IconRefresh, badge: 'builtin-due' },
      { key: 'topics',        labelKey: 'topics',          href: '/topics',             icon: IconLayers },
      { key: 'my-topics',     labelKey: 'myTopics',        href: '/my-topics',          icon: IconNotebook },
      { key: 'community-topics', labelKey: 'communityTopics', href: '/community/topics', icon: IconLayers },
      { key: 'ipa-chart',     labelKey: 'ipaChart',        href: '/learn/ipa',          icon: IconMic },
    ],
  },
  {
    key: 'practice',
    labelKey: 'practice',
    href: '/practice-test',
    icon: IconTarget,
    children: [
      { key: 'grammar',     labelKey: 'grammar',         href: '/grammar',                icon: IconBookOpen },
      { key: 'games',       labelKey: 'games',           href: '/games',                  icon: IconGamepad },
      { key: 'reading',     labelKey: 'reading',         href: '/practice-test/reading',  icon: IconBookOpen, premium: true },
      { key: 'listening',   labelKey: 'listening',       href: '/practice-test/listening', icon: IconHeadphones, premium: true },
      { key: 'writing',     labelKey: 'writing',         href: '/practice-test/writing',  icon: IconPenLine, premium: true },
      { key: 'speaking',    labelKey: 'speaking',        href: '/practice-test/speaking',   icon: IconMic, premium: true },
      { key: 'speaking-rooms', labelKey: 'speakingRooms', href: '/practice-test/speaking-rooms', icon: IconMic, beta: true },
      { key: 'arena',       labelKey: 'arena',           href: '/arena',                   icon: IconFlame, beta: true },
      { key: 'dictation',   labelKey: 'dictation',       href: '/practice-test/dictation', icon: IconHeadphones },
      { key: 'study-plan',  labelKey: 'studyPlan',       href: '/study-plan',               icon: IconTarget },
    ],
  },
  {
    key: 'progress',
    labelKey: 'progress',
    href: '/profile',
    icon: IconBarChart,
    children: [
      { key: 'profile',       labelKey: 'profile',      href: '/profile',       icon: IconUser },
      { key: 'achievements',  labelKey: 'achievements', href: '/achievements',  icon: IconTrophy },
      { key: 'leaderboard',   labelKey: 'leaderboard',  href: '/leaderboard',   icon: IconZap },
      { key: 'challenges',    labelKey: 'challenges',   href: '/challenges',    icon: IconBrain },
      { key: 'history',       labelKey: 'history',      href: '/history',       icon: IconClock },
    ],
  },
  {
    key: 'more',
    labelKey: 'more',
    href: '/settings',
    icon: IconMore,
    children: [
      { key: 'settings',   labelKey: 'settings',  href: '/settings',  icon: IconSettings },
      { key: 'resources',  labelKey: 'resources', href: '/resources', icon: IconLink },
      { key: 'pricing',    labelKey: 'pricing',   href: '/pricing',   icon: IconStar },
      { key: 'referral',   labelKey: 'referral',  href: '/referral',  icon: IconUser },
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
  '/my-topics',
  '/my-topics/following',
  '/community/topics',
  '/practice-test',
  '/practice-test/reading',
  '/practice-test/listening',
  '/practice-test/writing',
  '/practice-test/speaking',
  '/practice-test/speaking-rooms',
  '/arena',
  '/practice-test/dictation',
  '/study-plan',
  '/referral',
]);
