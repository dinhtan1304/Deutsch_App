'use client';

import { create } from 'zustand';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  showVietnamese: boolean;
  showPronunciation: boolean;
  showExamples: boolean;
  soundEnabled: boolean;
  speechRate: number;
  autoPlaySound: boolean;
  dailyGoal: number;
  preferredLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';
  questionsPerGame: number;
  timedChallengeSeconds: number;
  dailyReminder: boolean;
  weeklyEmailEnabled: boolean;
  webPushEnabled: boolean;
}

// Fields that are persisted to the backend DB (subset of AppSettings)
export const BACKEND_SETTINGS_KEYS: (keyof AppSettings)[] = [
  'theme', 'soundEnabled', 'dailyGoal', 'preferredLevel', 'showVietnamese', 'dailyReminder', 'weeklyEmailEnabled', 'webPushEnabled',
];

interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  loadSettings: () => void;
  /** Called after fetching backend settings - merges into local store */
  syncFromBackend: (backendSettings: Partial<AppSettings>) => void;
}

export const defaultSettings: AppSettings = {
  theme: 'system',
  showVietnamese: true,
  showPronunciation: true,
  showExamples: true,
  soundEnabled: true,
  speechRate: 0.8,
  autoPlaySound: false,
  dailyGoal: 20,
  preferredLevel: 'A1',   // matches DB default
  questionsPerGame: 20,
  timedChallengeSeconds: 60,
  dailyReminder: true,
  weeklyEmailEnabled: true,
  webPushEnabled: false,
};

const STORAGE_KEY = 'deutschmeister-settings';

function saveToStorage(settings: AppSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

function loadFromStorage(): AppSettings | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }
  }
  return null;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,

  loadSettings: () => {
    const stored = loadFromStorage();
    if (stored) {
      set({ settings: stored, isLoaded: true });
      applyTheme(stored.theme);
    } else {
      set({ isLoaded: true });
      applyTheme(defaultSettings.theme);
    }
  },

  syncFromBackend: (backendSettings) => {
    // Backend settings take priority over localStorage for the fields it owns
    const merged = { ...get().settings, ...backendSettings };
    set({ settings: merged });
    saveToStorage(merged);
    if (backendSettings.theme) {
      applyTheme(backendSettings.theme);
    }
  },

  updateSetting: (key, value) => {
    const newSettings = { ...get().settings, [key]: value };
    set({ settings: newSettings });
    saveToStorage(newSettings);

    if (key === 'theme') {
      applyTheme(value as 'light' | 'dark' | 'system');
    }
  },

  resetSettings: () => {
    set({ settings: defaultSettings });
    saveToStorage(defaultSettings);
    applyTheme(defaultSettings.theme);
  },
}));

/**
 * Apply theme using data-theme attribute AND class
 * This ensures our CSS overrides work correctly
 */
export function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return;

  const html = document.documentElement;

  let actualTheme: 'light' | 'dark';

  if (theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    actualTheme = theme;
  }

  html.setAttribute('data-theme', actualTheme);
  html.classList.remove('light', 'dark');
  html.classList.add(actualTheme);
  html.style.colorScheme = actualTheme;
}

// Apply theme immediately when module loads (before React)
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      applyTheme(settings.theme || 'system');
    } else {
      applyTheme('system');
    }
  } catch {
    applyTheme('system');
  }

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useSettingsStore.getState();
    if (state.settings.theme === 'system') {
      applyTheme('system');
    }
  });
}
