/**
 * Theme Value Object
 * Supported themes: Light, Dark, System (auto)
 */

export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

export const ThemeInfo: Record<Theme, {
  name: string;
  description: string;
  icon: string;
}> = {
  light: {
    name: 'Light',
    description: 'Light background with dark text',
    icon: '☀️'
  },
  dark: {
    name: 'Dark',
    description: 'Dark background with light text',
    icon: '🌙'
  },
  system: {
    name: 'System',
    description: 'Follow system preference',
    icon: '💻'
  }
};

/**
 * Check if a theme value is valid
 */
export function isValidTheme(theme: string): theme is Theme {
  return THEMES.includes(theme as Theme);
}

/**
 * Get the effective theme based on system preference
 */
export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default to light if can't detect
  }
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  const effectiveTheme = getEffectiveTheme(theme);
  const root = document.documentElement;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Store the current theme for reference
  root.setAttribute('data-theme', theme);
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}