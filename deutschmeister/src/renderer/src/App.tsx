/**
 * App Component
 * Root component of the DeutschMeister application
 */

import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRouter } from './AppRouter';
import { useSettingsStore } from './presentation/stores/settingsStore';
import { applyTheme } from './domain/valueObjects/Theme';

/**
 * Theme Initializer Component
 * Ensures theme is applied on app load
 */
function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const settings = useSettingsStore(state => state.settings);
  
  // Apply theme immediately on mount from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('deutschmeister-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const theme = parsed.state?.settings?.theme;
        if (theme) {
          console.log('Applying theme from localStorage:', theme);
          applyTheme(theme);
        } else {
          console.log('No theme in localStorage, applying light');
          applyTheme('light');
        }
      } catch (e) {
        console.log('Error parsing localStorage, applying light');
        applyTheme('light');
      }
    } else {
      console.log('No settings in localStorage, applying light');
      applyTheme('light');
    }
  }, []);

  // Apply theme whenever settings change
  useEffect(() => {
    if (settings?.theme) {
      console.log('Settings theme changed, applying:', settings.theme);
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

  return <>{children}</>;
}

/**
 * Main App Component
 * Wraps the application with necessary providers
 */
function App() {
  return (
    <HashRouter>
      <ThemeInitializer>
        <AppRouter />
      </ThemeInitializer>
    </HashRouter>
  );
}

export default App;