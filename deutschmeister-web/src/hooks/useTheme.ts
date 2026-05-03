'use client';

import { useReducer, useEffect } from 'react';

type Theme = 'light' | 'dark';
type ThemeState = { mounted: boolean; theme: Theme };
type ThemeAction = { type: 'init'; theme: Theme } | { type: 'set'; theme: Theme };

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'init': return { mounted: true, theme: action.theme };
    case 'set':  return { ...state, theme: action.theme };
  }
}

export function useTheme() {
  const [{ theme, mounted }, dispatch] = useReducer(themeReducer, { mounted: false, theme: 'light' });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      dispatch({ type: 'init', theme: savedTheme });
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      dispatch({ type: 'init', theme: prefersDark ? 'dark' : 'light' });
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'set', theme: newTheme });
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const setThemeMode = (newTheme: Theme) => {
    dispatch({ type: 'set', theme: newTheme });
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    mounted,
  };
}