export const ACCENT = {
  reading: '#22C55E',
  readingAlt: '#14B8A6',
  listening: '#EC4899',
  listeningAlt: '#8B5CF6',
  writing: '#6366F1',
  writingAlt: '#8B5CF6',
  writingExam: '#A855F7',
  speaking: '#EC4899',
  speakingAlt: '#F43F5E',
  games: '#F97316',
  gamesAlt: '#EF4444',
  srs: '#3B82F6',
  srsAlt: '#6366F1',
  xp: '#F59E0B',
  xpAlt: '#EF4444',
  premium: '#8B5CF6',
  premiumAlt: '#A855F7',
} as const;

export const STATUS = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
} as const;

export const GRADIENT = {
  reading: 'linear-gradient(135deg, #22C55E, #14B8A6)',
  listening: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
  writing: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  writingExam: 'linear-gradient(135deg, #A855F7, #6366F1)',
  speaking: 'linear-gradient(135deg, #EC4899, #F43F5E)',
  games: 'linear-gradient(135deg, #F97316, #EF4444)',
  srs: 'linear-gradient(135deg, #3B82F6, #6366F1)',
  xp: 'linear-gradient(90deg, #F59E0B, #EF4444)',
  premium: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  card: 16,
  xl: 20,
  pill: 9999,
} as const;

export const SHADOW = {
  sm: '0 1px 2px rgba(0,0,0,0.06)',
  card: '0 2px 8px rgba(0,0,0,0.06)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  hero: '0 12px 32px rgba(0,0,0,0.12)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const FONT_SIZE = {
  caption: 11,
  label: 12,
  body: 13,
  md: 14,
  lg: 16,
  title: 18,
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
