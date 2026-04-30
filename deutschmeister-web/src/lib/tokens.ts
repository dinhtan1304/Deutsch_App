/**
 * Design tokens — single source of truth for colors, gradients, radii, shadows,
 * spacing, and typography. Mirror of CSS vars in `src/app/globals.css`.
 *
 * Rules:
 * - Import ACCENT/GRADIENT at use sites; do not hardcode hex or inline gradients.
 * - If a token is missing for a legitimate need, add it here + globals.css together.
 */

export const ACCENT = {
  // Brand primary — default interactive, premium highlights
  brand: '#4F46E5',        // indigo-600

  // Core skill accents
  reading: '#22C55E',      // green-500
  writing: '#6366F1',      // indigo-500
  listening: '#EC4899',    // pink-500
  speaking: '#F43F5E',     // rose-500
  vocab: '#8B5CF6',        // violet-500
  examWriting: '#A855F7',  // purple-500 — exam-writing accent

  // Secondary contexts
  games: '#F97316',        // orange-500
  srs: '#3B82F6',          // blue-500
  xp: '#F59E0B',           // amber-500
  premium: '#8B5CF6',      // violet-500 — same hue as vocab (intentional)
  teal: '#14B8A6',         // teal-500 — reading gradient endpoint, dialogue type
  cyan: '#06B6D4',         // cyan-500 — aussprache/pronunciation criterion
} as const;

export const STATUS = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
} as const;

export const GRADIENT = {
  brand: 'linear-gradient(135deg, #4F46E5, #6366F1)',
  reading: 'linear-gradient(135deg, #22C55E, #14B8A6)',
  writing: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  listening: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
  vocab: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
  premium: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
  examWriting: 'linear-gradient(135deg, #A855F7, #6366F1)',   // purple → indigo, exam-writing
  pronunciation: 'linear-gradient(135deg, #EC4899, #A855F7)', // pink → purple, pronunciation
  // Functional gradients
  xp: 'linear-gradient(135deg, #F59E0B, #F97316)',       // amber → orange, favorites/xp
  action: 'linear-gradient(135deg, #3B82F6, #6366F1)',   // blue → indigo, general CTAs
  history: 'linear-gradient(135deg, #8B5CF6, #6366F1)',  // violet → indigo, history
  speaking: 'linear-gradient(135deg, #F59E0B, #EF4444)', // amber → red, speaking/free-speech
} as const;

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 9999,
} as const;

export const SHADOW = {
  none: 'none',
  soft: '0 2px 8px rgba(0,0,0,0.06)',
  lifted: '0 12px 32px rgba(0,0,0,0.12)',
} as const;

/**
 * Tailwind-aligned 4-scale. Keys match Tailwind spacing utility numbers
 * so `SPACING[4]` === `p-4` === 16px.
 */
export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

export const FONT_SIZE = {
  caption: 12,
  body: 14,
  lead: 16,
  h3: 18,
  h2: 22,
  h1: 28,
} as const;

export const THEME_VAR = {
  bgBody: 'var(--theme-bg-body)',
  bgCard: 'var(--theme-bg-card)',
  bgSecondary: 'var(--theme-bg-secondary)',
  bgTertiary: 'var(--theme-bg-tertiary)',
  textPrimary: 'var(--theme-text-primary)',
  textSecondary: 'var(--theme-text-secondary)',
  textMuted: 'var(--theme-text-muted)',
  border: 'var(--theme-border)',
  borderDark: 'var(--theme-border-dark)',
  overlaySoft: 'var(--theme-overlay-soft)',
  overlayStrong: 'var(--theme-overlay-strong)',
} as const;

export type AccentKey = keyof typeof ACCENT;
export type StatusKey = keyof typeof STATUS;
export type GradientKey = keyof typeof GRADIENT;
