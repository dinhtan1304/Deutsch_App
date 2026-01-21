/**
 * Settings Store
 * Zustand store for managing application settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Settings, 
  SettingsProps, 
  DEFAULT_SETTINGS,
  FontSize,
  AudioQuality,
  AnimationSpeed,
  ViewMode,
  PlaybackSpeed
} from '../../domain/entities/Settings';
import { Theme, applyTheme, watchSystemTheme, getEffectiveTheme } from '../../domain/valueObjects/Theme';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';

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
  initializeSettings: (profileId: string) => Promise<void>;
  loadSettings: (profileId: string) => Promise<void>;
  
  // Theme actions (UC-1.2.01)
  setTheme: (theme: Theme) => Promise<boolean>;
  
  // Font size actions (UC-1.2.02)
  setFontSize: (fontSize: FontSize) => Promise<boolean>;
  
  // Audio actions (UC-1.2.04, UC-1.2.05, UC-1.2.06)
  setVolume: (volume: number) => Promise<boolean>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<boolean>;
  setAudioQuality: (quality: AudioQuality) => Promise<boolean>;
  
  // Study settings actions (UC-1.2.08 - UC-1.2.11)
  setDailyReminder: (enabled: boolean, time?: string) => Promise<boolean>;
  setSessionDuration: (minutes: number) => Promise<boolean>;
  setBreakReminders: (enabled: boolean) => Promise<boolean>;
  setAutoDifficulty: (enabled: boolean) => Promise<boolean>;
  
  // Display settings actions (UC-1.2.12 - UC-1.2.15)
  setShowTranslations: (show: boolean) => Promise<boolean>;
  setArticleColorCoding: (enabled: boolean) => Promise<boolean>;
  setAnimationSpeed: (speed: AnimationSpeed) => Promise<boolean>;
  setViewMode: (mode: ViewMode) => Promise<boolean>;
  
  // Bulk update
  updateSettings: (updates: Partial<SettingsProps>) => Promise<boolean>;
  
  // Reset
  resetToDefaults: () => Promise<boolean>;
  
  // Utility
  setError: (error: string | null) => void;
}

/**
 * Settings Zustand Store
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
      initializeSettings: async (profileId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const repository = new SettingsRepository();
          let settings = await repository.getByProfileId(profileId);
          
          if (!settings) {
            // Create default settings
            settings = Settings.createDefault(uuidv4(), profileId);
            await repository.create(settings);
          }
          
          const settingsData = settings.toObject();
          const effectiveTheme = getEffectiveTheme(settingsData.theme);
          
          // Apply theme immediately
          applyTheme(settingsData.theme);
          
          set({ 
            settings: settingsData, 
            effectiveTheme,
            isLoading: false 
          });
          
          // Watch for system theme changes if using 'system' theme
          if (settingsData.theme === 'system') {
            watchSystemTheme((isDark) => {
              const currentSettings = get().settings;
              if (currentSettings?.theme === 'system') {
                set({ effectiveTheme: isDark ? 'dark' : 'light' });
                applyTheme('system');
              }
            });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to initialize settings'
          });
        }
      },

      /**
       * Load settings for a profile
       */
      loadSettings: async (profileId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const repository = new SettingsRepository();
          const settings = await repository.getByProfileId(profileId);
          
          if (settings) {
            const settingsData = settings.toObject();
            const effectiveTheme = getEffectiveTheme(settingsData.theme);
            applyTheme(settingsData.theme);
            
            set({ 
              settings: settingsData, 
              effectiveTheme,
              isLoading: false 
            });
          } else {
            set({ settings: null, isLoading: false });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to load settings'
          });
        }
      },

      /**
       * UC-1.2.01: Set Theme
       */
      setTheme: async (theme: Theme): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateTheme(theme);
          await repository.update(updatedSettings);
          
          const effectiveTheme = getEffectiveTheme(theme);
          applyTheme(theme);
          
          set({ 
            settings: updatedSettings.toObject(),
            effectiveTheme 
          });
          
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update theme' });
          return false;
        }
      },

      /**
       * UC-1.2.02: Set Font Size
       */
      setFontSize: async (fontSize: FontSize): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateFontSize(fontSize);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update font size' });
          return false;
        }
      },

      /**
       * UC-1.2.04: Set Volume
       */
      setVolume: async (volume: number): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateVolume(volume);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update volume' });
          return false;
        }
      },

      /**
       * UC-1.2.05: Set Playback Speed
       */
      setPlaybackSpeed: async (speed: PlaybackSpeed): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updatePlaybackSpeed(speed);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update playback speed' });
          return false;
        }
      },

      /**
       * UC-1.2.06: Set Audio Quality
       */
      setAudioQuality: async (quality: AudioQuality): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateAudioQuality(quality);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update audio quality' });
          return false;
        }
      },

      /**
       * UC-1.2.08: Set Daily Reminder
       */
      setDailyReminder: async (enabled: boolean, time?: string): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateDailyReminder(enabled, time);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update daily reminder' });
          return false;
        }
      },

      /**
       * UC-1.2.09: Set Session Duration
       */
      setSessionDuration: async (minutes: number): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateSessionDuration(minutes);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update session duration' });
          return false;
        }
      },

      /**
       * UC-1.2.10: Set Break Reminders
       */
      setBreakReminders: async (enabled: boolean): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateBreakReminders(enabled);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update break reminders' });
          return false;
        }
      },

      /**
       * UC-1.2.11: Set Auto Difficulty
       */
      setAutoDifficulty: async (enabled: boolean): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateAutoDifficulty(enabled);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update auto difficulty' });
          return false;
        }
      },

      /**
       * UC-1.2.12: Set Show Translations
       */
      setShowTranslations: async (show: boolean): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateShowTranslations(show);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update show translations' });
          return false;
        }
      },

      /**
       * UC-1.2.13: Set Article Color Coding
       */
      setArticleColorCoding: async (enabled: boolean): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateArticleColorCoding(enabled);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update article color coding' });
          return false;
        }
      },

      /**
       * UC-1.2.14: Set Animation Speed
       */
      setAnimationSpeed: async (speed: AnimationSpeed): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateAnimationSpeed(speed);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update animation speed' });
          return false;
        }
      },

      /**
       * UC-1.2.15: Set View Mode
       */
      setViewMode: async (mode: ViewMode): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateViewMode(mode);
          await repository.update(updatedSettings);
          
          set({ settings: updatedSettings.toObject() });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update view mode' });
          return false;
        }
      },

      /**
       * Update multiple settings at once
       */
      updateSettings: async (updates: Partial<SettingsProps>): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.fromPersistence(currentSettings);
          const updatedSettings = settings.updateMultiple(updates);
          await repository.update(updatedSettings);
          
          const newSettingsData = updatedSettings.toObject();
          
          // If theme changed, apply it
          if (updates.theme) {
            const effectiveTheme = getEffectiveTheme(updates.theme);
            applyTheme(updates.theme);
            set({ settings: newSettingsData, effectiveTheme });
          } else {
            set({ settings: newSettingsData });
          }
          
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
          return false;
        }
      },

      /**
       * UC-1.2.18: Reset to Defaults
       */
      resetToDefaults: async (): Promise<boolean> => {
        const currentSettings = get().settings;
        if (!currentSettings) return false;
        
        try {
          const repository = new SettingsRepository();
          const settings = Settings.createDefault(currentSettings.id, currentSettings.profileId);
          await repository.update(settings);
          
          const settingsData = settings.toObject();
          const effectiveTheme = getEffectiveTheme(settingsData.theme);
          applyTheme(settingsData.theme);
          
          set({ settings: settingsData, effectiveTheme });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to reset settings' });
          return false;
        }
      },

      setError: (error) => set({ error })
    }),
    {
      name: 'deutschmeister-settings-store',
      partialize: (state) => ({
        settings: state.settings,
        effectiveTheme: state.effectiveTheme
      })
    }
  )
);

// Selector hooks
export const useSettings = () => useSettingsStore((state) => state.settings);
export const useTheme = () => useSettingsStore((state) => state.settings?.theme ?? 'system');
export const useEffectiveTheme = () => useSettingsStore((state) => state.effectiveTheme);
export const useFontSize = () => useSettingsStore((state) => state.settings?.fontSize ?? 'medium');
export const useVolume = () => useSettingsStore((state) => state.settings?.volume ?? 80);