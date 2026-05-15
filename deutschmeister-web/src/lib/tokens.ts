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
  dictation: '#06B6D4',    // cyan-500 — dictation feature accent
  emerald: '#10B981',      // emerald-500 — games/progress charts
  gray: '#6B7280',          // gray-500 — neutral fallback (article colors, etc.)
  xpDark: '#D97706',        // amber-600 — tip text, darker xp accent
  // Light variants — text on dark article card backgrounds
  srsLight: '#93C5FD',     // blue-300 — "der" chip text
  listeningLight: '#F9A8D4', // pink-300 — "die" chip text
  tealLight: '#5EEAD4',    // teal-300 — "das" chip text
  emeraldLight: '#34D399', // emerald-400 — card back accent text
  readingLight: '#4ADE80', // green-400 — completed task chip text
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
  dictation: 'linear-gradient(135deg, #06B6D4, #3B82F6)', // cyan → blue, dictation
  subscription: 'linear-gradient(90deg, #6366F1, #8B5CF6, #10B981)', // indigo → violet → emerald, subscription bar
  emerald: 'linear-gradient(135deg, #10B981, #34D399)',   // emerald, games legend dot
  wordsBar: 'linear-gradient(180deg, #6366F1, #3B82F6)',  // indigo → blue, words chart bar (vertical)
  gamesBar: 'linear-gradient(180deg, #34D399, #10B981)',  // emerald, games chart bar (vertical)
  srsIconBg: 'linear-gradient(135deg, rgba(59,130,246,.15), rgba(99,102,241,.1))', // subtle srs icon bg
  progressBar: 'linear-gradient(90deg, #3B82F6, #22C55E)', // blue → green, progress bar
  // SRS article card backgrounds (dark, immersive)
  cardDer: 'linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%)', // dark blue — "der"
  cardDie: 'linear-gradient(135deg, #2a0a1e 0%, #9d174d 100%)', // dark pink — "die"
  cardDas: 'linear-gradient(135deg, #0a2218 0%, #065f46 100%)', // dark green — "das"
  cardDefault: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', // dark indigo — default/vi-de
  cardBack: 'linear-gradient(135deg, #0f2a1a 0%, #064e3b 60%, #065f46 100%)', // dark emerald — card back face
  readingGreen: 'linear-gradient(135deg, #22C55E, #16A34A)', // green-500 → green-600, monochromatic reading
  readingGreenH: 'linear-gradient(90deg, #22C55E, #16A34A)',  // green-500 → green-600, horizontal — completed progress bar
  xpGoldH: 'linear-gradient(90deg, #F59E0B, #D97706)',        // amber-500 → amber-600, horizontal — mid-score bar
  dangerSolidH: 'linear-gradient(90deg, #EF4444, #DC2626)',   // red-500 → red-600, horizontal — low-score bar
  dangerSolid: 'linear-gradient(135deg, #EF4444, #DC2626)',   // red-500 → red-600, diagonal — danger CTA button
  der: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',           // blue-500 → blue-700, masculine article badge
  die: 'linear-gradient(135deg, #EC4899, #BE185D)',           // pink-500 → pink-700, feminine article badge
  das: 'linear-gradient(135deg, #22C55E, #15803D)',           // green-500 → green-700, neuter article badge
  xpGold: 'linear-gradient(135deg, #F59E0B, #D97706)',       // amber-500 → amber-600, premium/gold CTA
  dangerBg: 'linear-gradient(135deg, rgba(239,68,68,.1), rgba(239,68,68,.2))', // error icon bg
  silver: 'linear-gradient(135deg, #9CA3AF, #6B7280)', // gray-400 → gray-500, 2nd place
  bronze: 'linear-gradient(135deg, #CD7C2F, #A16207)', // bronze → amber-700, 3rd place
  // Subtle card background variants (low-opacity)
  readingBg: 'linear-gradient(135deg, rgba(34,197,94,.08), rgba(20,184,166,.04))',
  warnDangerBg: 'linear-gradient(135deg, rgba(239,68,68,.05), rgba(245,158,11,.03))',
  dangerGamesBg: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(249,115,22,.10))',
  dangerGames: 'linear-gradient(135deg, #EF4444, #F97316)',    // red → orange, streak warning
  dangerToXp: 'linear-gradient(90deg, #EF4444, #F59E0B)',     // red → amber, overdue bar
  srsBg: 'linear-gradient(135deg, rgba(59,130,246,0.03), rgba(139,92,246,0.05))',
  srsVocab: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',      // blue → violet, study plan icon
  vocabBg: 'linear-gradient(135deg, rgba(139,92,246,.1), rgba(168,85,247,.06))',
  xpBg: 'linear-gradient(135deg, rgba(245,158,11,.1), rgba(251,191,36,.06))',
  listeningBg: 'linear-gradient(135deg, rgba(236,72,153,.1), rgba(168,85,247,.06))',
  cyanBg: 'linear-gradient(135deg, rgba(6,182,212,.1), rgba(14,165,233,.06))',
  // Icon/badge gradient variants
  xpLight: 'linear-gradient(135deg, #F59E0B, #FBBF24)',   // amber-500 → amber-400, soft xp
  cyanSky: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',   // cyan → sky-500
  xpBright: 'linear-gradient(135deg, #FBBF24, #F97316)',  // amber-400 → orange-500
  xpReverse: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)', // orange → amber (streak bar)
  readingBgSoft: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(20,184,166,0.03))', // very soft reading bg
  readingH: 'linear-gradient(90deg, #22C55E, #14B8A6)',   // reading, horizontal — progress bars
  srsVocabH: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',  // srs/vocab, horizontal — progress bars
  listeningIconBg: 'linear-gradient(135deg, rgba(236,72,153,.12), rgba(244,114,182,.08))', // pink icon bg — listening header/empty
  progressBarEmerald: 'linear-gradient(90deg, #3B82F6, #10B981)', // blue → emerald, topic overall progress bar
  emeraldH: 'linear-gradient(90deg, #10B981, #34D399)',   // emerald horizontal — completed topic bar
  actionH: 'linear-gradient(90deg, #3B82F6, #6366F1)',   // blue → indigo, horizontal — challenge/progress bars
  writingH: 'linear-gradient(90deg, #6366F1, #A855F7)',  // indigo → purple, horizontal — xp level bar
  premiumAuraBg: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))', // premium membership card bg
  grayAuraBg: 'linear-gradient(135deg, rgba(107,114,128,0.15), rgba(75,85,99,0.15))',     // free-plan card bg
  vocabDeepBg: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))',  // violet → indigo, paywall/premium overlay bg
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

export const MOTION = {
  duration: { instant: 0.1, fast: 0.18, base: 0.28, slow: 0.45, celebrate: 0.7 },
  ease: {
    standard: [0.4, 0, 0.2, 1] as const,
    decelerate: [0, 0, 0.2, 1] as const,
    accelerate: [0.4, 0, 1, 1] as const,
  },
  spring: {
    soft: { type: 'spring', stiffness: 220, damping: 26 } as const,
    snappy: { type: 'spring', stiffness: 380, damping: 28 } as const,
    bouncy: { type: 'spring', stiffness: 500, damping: 18 } as const,
  },
  stagger: { tight: 0.04, base: 0.07, loose: 0.12 },
} as const;

export type AccentKey = keyof typeof ACCENT;
export type StatusKey = keyof typeof STATUS;
export type GradientKey = keyof typeof GRADIENT;
export type MotionDurationKey = keyof typeof MOTION.duration;
