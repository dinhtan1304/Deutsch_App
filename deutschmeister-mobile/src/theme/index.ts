import tokens from './tokens.json';

// ── Types ──────────────────────────────────────────────
export type PastelKey = 'lime' | 'mint' | 'lavender' | 'sky' | 'rose' | 'peach';
export type Gender = 'der' | 'die' | 'das';

type PastelPalette = { base: string; dim: string; on: string };

// ── Colors ─────────────────────────────────────────────
export const colors = {
  bg: {
    b0: tokens.color.base.b0.value,
    b1: tokens.color.base.b1.value,
    b2: tokens.color.base.b2.value,
    b3: tokens.color.base.b3.value,
    b4: tokens.color.base.b4.value,
  },
  pastel: {
    lime:     { base: tokens.color.pastel.lime.base.value,     dim: tokens.color.pastel.lime.dim.value,     on: tokens.color.pastel.lime.on.value },
    mint:     { base: tokens.color.pastel.mint.base.value,     dim: tokens.color.pastel.mint.dim.value,     on: tokens.color.pastel.mint.on.value },
    lavender: { base: tokens.color.pastel.lavender.base.value, dim: tokens.color.pastel.lavender.dim.value, on: tokens.color.pastel.lavender.on.value },
    sky:      { base: tokens.color.pastel.sky.base.value,      dim: tokens.color.pastel.sky.dim.value,      on: tokens.color.pastel.sky.on.value },
    rose:     { base: tokens.color.pastel.rose.base.value,     dim: tokens.color.pastel.rose.dim.value,     on: tokens.color.pastel.rose.on.value },
    peach:    { base: tokens.color.pastel.peach.base.value,    dim: tokens.color.pastel.peach.dim.value,    on: tokens.color.pastel.peach.on.value },
  } satisfies Record<PastelKey, PastelPalette>,
  text: {
    primary:   tokens.color.text.primary.value,
    secondary: tokens.color.text.secondary.value,
    tertiary:  tokens.color.text.tertiary.value,
    disabled:  tokens.color.text.disabled.value,
  },
  border: {
    subtle:  tokens.color.border.subtle.value,
    default: tokens.color.border.default.value,
    strong:  tokens.color.border.strong.value,
  },
  semantic: {
    correct: tokens.color.pastel.mint.base.value,
    wrong:   tokens.color.pastel.rose.base.value,
    xp:      tokens.color.pastel.peach.base.value,
    level:   tokens.color.pastel.lavender.base.value,
    cta:     tokens.color.pastel.lime.base.value,
    nounDer: tokens.color.pastel.sky.base.value,
    nounDie: tokens.color.pastel.rose.base.value,
    nounDas: tokens.color.pastel.mint.base.value,
  },
} as const;

// ── Spacing ────────────────────────────────────────────
export const spacing = {
  xs:  tokens.spacing.xs.value,
  sm:  tokens.spacing.sm.value,
  md:  tokens.spacing.md.value,
  lg:  tokens.spacing.lg.value,
  xl:  tokens.spacing.xl.value,
  '2xl': tokens.spacing['2xl'].value,
  '3xl': tokens.spacing['3xl'].value,
  screenH: tokens.spacing['screen-h'].value,
} as const;

// ── Border Radius ──────────────────────────────────────
export const radius = {
  sm:   tokens.borderRadius.sm.value,
  md:   tokens.borderRadius.md.value,
  lg:   tokens.borderRadius.lg.value,
  xl:   tokens.borderRadius.xl.value,
  stone: tokens.borderRadius.stone.value,
  '2xl': tokens.borderRadius['2xl'].value,
  pill: tokens.borderRadius.pill.value,
} as const;

// ── Typography ─────────────────────────────────────────
export const typography = {
  fontFamily: {
    heading: 'Quicksand_700Bold',
    headingMedium: 'Quicksand_500Medium',
    headingSemibold: 'Quicksand_600SemiBold',
    body: 'Nunito_400Regular',
    bodyMedium: 'Nunito_500Medium',
    bodySemibold: 'Nunito_600SemiBold',
    bodyBold: 'Nunito_700Bold',
    bodyBlack: 'Nunito_800ExtraBold',
    mono: 'SpaceMono',
  },
  fontSize: {
    xs:   tokens.typography.fontSize.xs.value,
    sm:   tokens.typography.fontSize.sm.value,
    base: tokens.typography.fontSize.base.value,
    md:   tokens.typography.fontSize.md.value,
    lg:   tokens.typography.fontSize.lg.value,
    xl:   tokens.typography.fontSize.xl.value,
    word: tokens.typography.fontSize.word.value,
    hero: tokens.typography.fontSize.hero.value,
  },
  fontWeight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '800' as const,
  },
  lineHeight: {
    tight:   tokens.typography.lineHeight.tight.value,
    snug:    tokens.typography.lineHeight.snug.value,
    normal:  tokens.typography.lineHeight.normal.value,
    relaxed: tokens.typography.lineHeight.relaxed.value,
  },
  letterSpacing: {
    tight:  tokens.typography.letterSpacing.tight.value,
    snug:   tokens.typography.letterSpacing.snug.value,
    normal: tokens.typography.letterSpacing.normal.value,
    wide:   tokens.typography.letterSpacing.wide.value,
    widest: tokens.typography.letterSpacing.widest.value,
  },
} as const;

// ── Animation ──────────────────────────────────────────
export const animation = {
  duration: {
    fast:   150,
    normal: 250,
    slow:   400,
  },
  easing: {
    default:    tokens.animation.easing.default.value,
    spring:     tokens.animation.easing.spring.value,
    decelerate: tokens.animation.easing.decelerate.value,
  },
} as const;

// ── Shadows ────────────────────────────────────────────
export const zenGlow = {
  shadowColor: '#8EAD92',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.1,
  shadowRadius: 20,
  elevation: 3,
} as const;

export const floatShadow = {
  shadowColor: '#1A2421',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 8,
} as const;

// ── Component tokens ───────────────────────────────────
export const component = {
  statusBar: { height: tokens.component.statusBar.height.value },
  bottomNav: {
    height: tokens.component.bottomNav.height.value,
    borderRadius: tokens.component.bottomNav.borderRadius.value,
    margin: { top: 8, horizontal: 12, bottom: 12 },
  },
  card: {
    padding: { vertical: 14, horizontal: 16 },
  },
  heroCard: {
    accentBorder: tokens.component.heroCard.accentBorder.value,
    padding: { vertical: 18, horizontal: 20 },
  },
  button: {
    height: tokens.component.button.primary.height.value,
  },
} as const;

// ── Helpers ────────────────────────────────────────────
export function pastelSurface(color: PastelKey) {
  const p = colors.pastel[color];
  return {
    backgroundColor: p.dim,
    borderColor: p.base + '33', // 20% opacity
  } as const;
}

export function genderColor(gender: Gender): PastelKey {
  const map: Record<Gender, PastelKey> = { der: 'sky', die: 'rose', das: 'mint' };
  return map[gender];
}

// Re-export gradient helpers
export { featureGradient, scoreGradient } from './gradients';
export type { FeatureKey } from './gradients';
