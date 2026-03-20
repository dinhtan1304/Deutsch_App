import type { ThemeColors } from './colors';

export type FeatureKey =
  | 'flashcards' | 'quick-quiz' | 'matching' | 'timed-challenge'
  | 'fill-blank' | 'spelling' | 'gender-quiz' | 'listening-game'
  | 'reading' | 'writing' | 'speaking' | 'listening';

/** Returns a gradient pair for a given feature/game */
export function featureGradient(colors: ThemeColors, feature: FeatureKey): [string, string] {
  const map: Record<FeatureKey, [string, string]> = {
    reading:            colors.gradient.reading,
    writing:            colors.gradient.writing,
    listening:          colors.gradient.listening,
    speaking:           colors.gradient.speaking,
    flashcards:         [colors.pastel.sky.base, colors.pastel.mint.base],
    'quick-quiz':       colors.gradient.quiz,
    matching:           [colors.pastel.lime.base, colors.pastel.mint.base],
    'timed-challenge':  colors.gradient.danger,
    'fill-blank':       colors.gradient.warning,
    spelling:           [colors.pastel.rose.base, colors.pastel.lavender.base],
    'gender-quiz':      [colors.pastel.lime.base, colors.pastel.mint.base],
    'listening-game':   [colors.pastel.mint.base, colors.pastel.sky.base],
  };
  return map[feature];
}

/** Returns a gradient pair based on score percentage */
export function scoreGradient(colors: ThemeColors, score: number): [string, string] {
  if (score >= 80) return colors.gradient.correct;
  if (score >= 60) return colors.gradient.warning;
  return colors.gradient.danger;
}
