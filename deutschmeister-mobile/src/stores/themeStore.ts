import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance } from 'react-native';
import { mmkvStorage } from '@/lib/storage';
import { darkColors, lightColors, type ThemeColors } from '@/theme/colors';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  _hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setHasHydrated: (state: boolean) => void;
}

function resolveColors(mode: ThemeMode): { colors: ThemeColors; isDark: boolean } {
  if (mode === 'system') {
    const scheme = Appearance.getColorScheme();
    const isDark = scheme !== 'light';
    return { colors: isDark ? darkColors : lightColors, isDark };
  }
  const isDark = mode === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      colors: darkColors,
      isDark: true,
      _hasHydrated: false,

      setMode: (mode: ThemeMode) => {
        const { colors, isDark } = resolveColors(mode);
        set({ mode, colors, isDark });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Re-resolve colors from persisted mode
          const { colors, isDark } = resolveColors(state.mode);
          state.colors = colors;
          state.isDark = isDark;
          state._hasHydrated = true;
        }
      },
    },
  ),
);

// Re-export for convenience
export type { ThemeColors };
