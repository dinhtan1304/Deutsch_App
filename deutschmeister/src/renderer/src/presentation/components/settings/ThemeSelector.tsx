/**
 * Theme Selector Component
 * Allows user to switch between Light, Dark, and System themes
 */

import React from 'react';
import { Theme, THEMES, ThemeInfo } from '../../../domain/valueObjects/Theme';
import { useSettingsStore, useTheme, useEffectiveTheme } from '../../stores/settingsStore';
import { cn } from '../../../shared/utils/cn';

export interface ThemeSelectorProps {
  compact?: boolean;
}

export function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const currentTheme = useTheme();
  const effectiveTheme = useEffectiveTheme();
  const { setTheme } = useSettingsStore();

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme}
            onClick={() => handleThemeChange(theme)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all',
              currentTheme === theme
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
            title={ThemeInfo[theme].name}
          >
            {ThemeInfo[theme].icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const isSelected = currentTheme === theme;
          const info = ThemeInfo[theme];
          
          return (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={cn(
                'flex flex-col items-center rounded-xl border-2 p-4 transition-all',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              {/* Theme Preview */}
              <div className={cn(
                'mb-3 flex h-12 w-full items-center justify-center rounded-lg text-2xl',
                theme === 'light' && 'bg-white border border-gray-200',
                theme === 'dark' && 'bg-gray-800',
                theme === 'system' && 'bg-gradient-to-r from-white to-gray-800 border border-gray-200'
              )}>
                {info.icon}
              </div>
              
              {/* Theme Name */}
              <span className={cn(
                'font-medium',
                isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'
              )}>
                {info.name}
              </span>
              
              {/* Description */}
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                {info.description}
              </span>

              {/* Current indicator for system theme */}
              {theme === 'system' && isSelected && (
                <span className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Currently: {effectiveTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}