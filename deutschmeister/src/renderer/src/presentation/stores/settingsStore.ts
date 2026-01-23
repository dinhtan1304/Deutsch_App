/**
 * Settings Store
 * Zustand store for managing application settings
 * Uses Zustand persist middleware for auto-save to localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  SettingsProps, 
  DEFAULT_SETTINGS,
  FontSize,
  AudioQuality,
  AnimationSpeed,
  ViewMode,
  PlaybackSpeed
} from '../../domain/entities/Settings';
import { Theme, applyTheme, watchSystemTheme, getEffectiveTheme } from '../../domain/valueObjects/Theme';

/**
 * Settings state interface
 */
interface SettingsState {
  // Settings data
  settings: SettingsProps | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed
  effectiveTheme: 'light' | 'dark';
  
  // Actions
  initializeSettings: (profileId: string) => void;
  
  // Theme actions (UC-1.2.01)
  setTheme: (theme: Theme) => void;
  
  // Font size actions (UC-1.2.02)
  setFontSize: (fontSize: FontSize) => void;
  
  // Audio actions (UC-1.2.04, UC-1.2.05, UC-1.2.06)
  setVolume: (volume: number) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setAudioQuality: (quality: AudioQuality) => void;
  
  // Study settings actions (UC-1.2.08 - UC-1.2.11)
  setDailyReminder: (enabled: boolean, time?: string) => void;
  setSessionDuration: (minutes: number) => void;
  setBreakReminders: (enabled: boolean) => void;
  setAutoDifficulty: (enabled: boolean) => void;
  
  // Display settings actions (UC-1.2.12 - UC-1.2.15)
  setShowTranslations: (show: boolean) => void;
  setArticleColorCoding: (enabled: boolean) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Bulk update
  updateSettings: (updates: Partial<SettingsProps>) => void;
  
  // Reset
  resetToDefaults: () => void;
  
  // Utility
  setError: (error: string | null) => void;
}

/**
 * Custom storage that handles Date serialization
 */
const customStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    
    try {
      const parsed = JSON.parse(str);
      // Convert date strings back to Date objects
      if (parsed.state?.settings) {
        if (parsed.state.settings.createdAt) {
          parsed.state.settings.createdAt = new Date(parsed.state.settings.createdAt);
        }
        if (parsed.state.settings.updatedAt) {
          parsed.state.settings.updatedAt = new Date(parsed.state.settings.updatedAt);
        }
      }
      return JSON.stringify(parsed);
    } catch {
      return str;
    }
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

/**
 * Settings Zustand Store with persist middleware
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: null,
      isLoading: false,
      error: null,
      effectiveTheme: 'light',

      /**
       * Initialize settings for a profile (create if not exists)
       */
      initializeSettings: (profileId: string) => {
        const currentSettings = get().settings;
        
        // If settings already exist for this profile, just apply theme
        if (currentSettings && currentSettings.profileId === profileId) {
          const effectiveTheme = getEffectiveTheme(currentSettings.theme);
          applyTheme(currentSettings.theme);
          set({ effectiveTheme });
          
          // Watch for system theme changes
          if (currentSettings.theme === 'system') {
            watchSystemTheme((isDark) => {
              const settings = get().settings;
              if (settings?.theme === 'system') {
                set({ effectiveTheme: isDark ? 'dark' : 'light' });
                applyTheme('system');
              }
            });
          }
          return;
        }
        
        // Create default settings for new profile
        const now = new Date();
        const newSettings: SettingsProps = {
          id: uuidv4(),
          profileId,
          ...DEFAULT_SETTINGS,
          createdAt: now,
          updatedAt: now
        };
        
        const effectiveTheme = getEffectiveTheme(newSettings.theme);
        applyTheme(newSettings.theme);
        
        set({ 
          settings: newSettings, 
          effectiveTheme,
          isLoading: false 
        });
        
        // Watch for system theme changes if using 'system' theme
        if (newSettings.theme === 'system') {
          watchSystemTheme((isDark) => {
            const settings = get().settings;
            if (settings?.theme === 'system') {
              set({ effectiveTheme: isDark ? 'dark' : 'light' });
              applyTheme('system');
            }
          });
        }
      },

      /**
       * UC-1.2.01: Set Theme
       */
      setTheme: (theme: Theme) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        const effectiveTheme = getEffectiveTheme(theme);
        applyTheme(theme);
        
        set({ 
          settings: {
            ...currentSettings,
            theme,
            updatedAt: new Date()
          },
          effectiveTheme 
        });
      },

      /**
       * UC-1.2.02: Set Font Size
       */
      setFontSize: (fontSize: FontSize) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            fontSize,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.04: Set Volume
       */
      setVolume: (volume: number) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            volume: Math.round(Math.min(100, Math.max(0, volume))),
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.05: Set Playback Speed
       */
      setPlaybackSpeed: (speed: PlaybackSpeed) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            playbackSpeed: speed,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.06: Set Audio Quality
       */
      setAudioQuality: (quality: AudioQuality) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            audioQuality: quality,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.08: Set Daily Reminder
       */
      setDailyReminder: (enabled: boolean, time?: string) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            dailyReminderEnabled: enabled,
            dailyReminderTime: time ?? currentSettings.dailyReminderTime,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.09: Set Session Duration
       */
      setSessionDuration: (minutes: number) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            sessionDurationMinutes: Math.min(120, Math.max(5, minutes)),
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.10: Set Break Reminders
       */
      setBreakReminders: (enabled: boolean) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            breakRemindersEnabled: enabled,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.11: Set Auto Difficulty
       */
      setAutoDifficulty: (enabled: boolean) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            autoDifficultyEnabled: enabled,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.12: Set Show Translations
       */
      setShowTranslations: (show: boolean) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            showTranslations: show,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.13: Set Article Color Coding
       */
      setArticleColorCoding: (enabled: boolean) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            articleColorCoding: enabled,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.14: Set Animation Speed
       */
      setAnimationSpeed: (speed: AnimationSpeed) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            animationSpeed: speed,
            updatedAt: new Date()
          }
        });
      },

      /**
       * UC-1.2.15: Set View Mode
       */
      setViewMode: (mode: ViewMode) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        set({ 
          settings: {
            ...currentSettings,
            viewMode: mode,
            updatedAt: new Date()
          }
        });
      },

      /**
       * Update multiple settings at once
       */
      updateSettings: (updates: Partial<SettingsProps>) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        const newSettings = {
          ...currentSettings,
          ...updates,
          updatedAt: new Date()
        };
        
        // If theme changed, apply it
        if (updates.theme) {
          const effectiveTheme = getEffectiveTheme(updates.theme);
          applyTheme(updates.theme);
          set({ settings: newSettings, effectiveTheme });
        } else {
          set({ settings: newSettings });
        }
      },

      /**
       * UC-1.2.18: Reset to Defaults
       */
      resetToDefaults: () => {
        const currentSettings = get().settings;
        if (!currentSettings) return;
        
        const now = new Date();
        const newSettings: SettingsProps = {
          id: currentSettings.id,
          profileId: currentSettings.profileId,
          ...DEFAULT_SETTINGS,
          createdAt: currentSettings.createdAt,
          updatedAt: now
        };
        
        const effectiveTheme = getEffectiveTheme(newSettings.theme);
        applyTheme(newSettings.theme);
        
        set({ settings: newSettings, effectiveTheme });
      },

      setError: (error) => set({ error })
    }),
    {
      name: 'deutschmeister-settings',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        settings: state.settings,
        effectiveTheme: state.effectiveTheme
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state?.settings?.theme) {
          const effectiveTheme = getEffectiveTheme(state.settings.theme);
          applyTheme(state.settings.theme);
          // We need to update effectiveTheme after rehydration
          setTimeout(() => {
            useSettingsStore.setState({ effectiveTheme });
          }, 0);
        }
      }
    }
  )
);

// Selector hooks
export const useSettings = () => useSettingsStore((state) => state.settings);
export const useTheme = () => useSettingsStore((state) => state.settings?.theme ?? 'system');
export const useEffectiveTheme = () => useSettingsStore((state) => state.effectiveTheme);
export const useFontSize = () => useSettingsStore((state) => state.settings?.fontSize ?? 'medium');
export const useVolume = () => useSettingsStore((state) => state.settings?.volume ?? 80);