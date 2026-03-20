/**
 * Dark & Light color palettes for Zen Focus theme.
 * Dark is the primary palette; Light mirrors the structure with adjusted values.
 */

type PastelPalette = { base: string; dim: string; on: string };

export interface ThemeColors {
  bg: { b0: string; b1: string; b2: string; b3: string; b4: string };
  pastel: {
    lime: PastelPalette;
    mint: PastelPalette;
    lavender: PastelPalette;
    sky: PastelPalette;
    rose: PastelPalette;
    peach: PastelPalette;
  };
  text: { primary: string; secondary: string; tertiary: string; disabled: string };
  border: { subtle: string; default: string; strong: string };
  semantic: {
    correct: string; wrong: string; xp: string; level: string;
    cta: string; nounDer: string; nounDie: string; nounDas: string;
  };
  gradient: {
    reading: [string, string];
    writing: [string, string];
    listening: [string, string];
    speaking: [string, string];
    quiz: [string, string];
    correct: [string, string];
    warning: [string, string];
    danger: [string, string];
  };
}

// ── Dark Theme (Zen Focus Dark) ──────────────────────
export const darkColors: ThemeColors = {
  bg: {
    b0: '#1A2421',
    b1: '#1F2B27',
    b2: '#25332E',
    b3: '#2D3E38',
    b4: '#354842',
  },
  pastel: {
    lime:     { base: '#8EAD92', dim: 'rgba(142,173,146,0.10)', on: '#0a1a0f' },
    mint:     { base: '#7BC88C', dim: 'rgba(123,200,140,0.10)', on: '#052a1a' },
    lavender: { base: '#B8A9D4', dim: 'rgba(184,169,212,0.10)', on: '#1a0a3a' },
    sky:      { base: '#8BB5CF', dim: 'rgba(139,181,207,0.10)', on: '#011a2a' },
    rose:     { base: '#D4838E', dim: 'rgba(212,131,142,0.10)', on: '#2a0010' },
    peach:    { base: '#D4B483', dim: 'rgba(212,180,131,0.10)', on: '#2a1000' },
  },
  text: {
    primary:   '#E1E8E4',
    secondary: '#8A9D97',
    tertiary:  '#4A5D57',
    disabled:  '#3A4D47',
  },
  border: {
    subtle:  'rgba(225,232,228,0.06)',
    default: 'rgba(225,232,228,0.10)',
    strong:  'rgba(225,232,228,0.18)',
  },
  semantic: {
    correct: '#7BC88C',
    wrong:   '#D4838E',
    xp:      '#D4B483',
    level:   '#B8A9D4',
    cta:     '#8EAD92',
    nounDer: '#8BB5CF',
    nounDie: '#D4838E',
    nounDas: '#7BC88C',
  },
  gradient: {
    reading:   ['#7BC88C', '#8EAD92'],
    writing:   ['#8EAD92', '#B8A9D4'],
    listening: ['#D4B483', '#C49A5A'],
    speaking:  ['#D4838E', '#D4B483'],
    quiz:      ['#B8A9D4', '#8A79B4'],
    correct:   ['#7BC88C', '#8EAD92'],
    warning:   ['#D4B483', '#C49A5A'],
    danger:    ['#D4838E', '#D4B483'],
  },
};

// ── Light Theme (Zen Focus Light) ────────────────────
export const lightColors: ThemeColors = {
  bg: {
    b0: '#F5F7F5',
    b1: '#EDF1ED',
    b2: '#E3E9E5',
    b3: '#D6DED8',
    b4: '#C9D3CC',
  },
  pastel: {
    lime:     { base: '#6B8E70', dim: 'rgba(107,142,112,0.12)', on: '#FFFFFF' },
    mint:     { base: '#4BA660', dim: 'rgba(75,166,96,0.12)',   on: '#FFFFFF' },
    lavender: { base: '#8B7AAE', dim: 'rgba(139,122,174,0.12)', on: '#FFFFFF' },
    sky:      { base: '#5A8FAF', dim: 'rgba(90,143,175,0.12)',  on: '#FFFFFF' },
    rose:     { base: '#C4616E', dim: 'rgba(196,97,110,0.12)',  on: '#FFFFFF' },
    peach:    { base: '#C49A5A', dim: 'rgba(196,154,90,0.12)',  on: '#FFFFFF' },
  },
  text: {
    primary:   '#1A2421',
    secondary: '#4A5D57',
    tertiary:  '#7A8E88',
    disabled:  '#A0B0AA',
  },
  border: {
    subtle:  'rgba(26,36,33,0.06)',
    default: 'rgba(26,36,33,0.12)',
    strong:  'rgba(26,36,33,0.20)',
  },
  semantic: {
    correct: '#4BA660',
    wrong:   '#C4616E',
    xp:      '#C49A5A',
    level:   '#8B7AAE',
    cta:     '#6B8E70',
    nounDer: '#5A8FAF',
    nounDie: '#C4616E',
    nounDas: '#4BA660',
  },
  gradient: {
    reading:   ['#4BA660', '#6B8E70'],
    writing:   ['#6B8E70', '#8B7AAE'],
    listening: ['#C49A5A', '#A67D3D'],
    speaking:  ['#C4616E', '#C49A5A'],
    quiz:      ['#8B7AAE', '#6A5C94'],
    correct:   ['#4BA660', '#6B8E70'],
    warning:   ['#C49A5A', '#A67D3D'],
    danger:    ['#C4616E', '#C49A5A'],
  },
};
