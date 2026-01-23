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
  console.log('getEffectiveTheme called with:', theme);
  
  if (theme === 'system') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('System prefers dark:', isDark);
      return isDark ? 'dark' : 'light';
    }
    return 'light'; // Default to light if can't detect
  }
  
  console.log('Returning theme directly:', theme);
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  const effectiveTheme = getEffectiveTheme(theme);
  const root = document.documentElement;

  console.log('applyTheme called:', { theme, effectiveTheme });
  console.log('Before - html classes:', root.className);

  // Remove or add dark class
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    
    // Set CSS custom properties for dark mode
    root.style.setProperty('--page-bg', '#111827');
    root.style.setProperty('--card-bg', '#1f2937');
    root.style.setProperty('--text-primary', '#f9fafb');
    root.style.setProperty('--text-secondary', '#d1d5db');
    root.style.setProperty('--border-color', '#374151');
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    
    // Set CSS custom properties for light mode
    root.style.setProperty('--page-bg', '#f9fafb');
    root.style.setProperty('--card-bg', '#ffffff');
    root.style.setProperty('--text-primary', '#111827');
    root.style.setProperty('--text-secondary', '#6b7280');
    root.style.setProperty('--border-color', '#e5e7eb');
  }

  console.log('After - html classes:', root.className);

  // Store the current theme for reference
  root.setAttribute('data-theme', theme);
  
  // Force update body background based on theme
  const body = document.body;
  if (effectiveTheme === 'dark') {
    body.style.backgroundColor = '#111827';
    body.style.color = '#f9fafb';
  } else {
    body.style.backgroundColor = '#f9fafb';
    body.style.color = '#111827';
  }
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