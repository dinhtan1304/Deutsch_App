/**
 * App Component
 * Root component of the DeutschMeister application
 */

import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRouter } from './AppRouter';

/**
 * Main App Component
 * Wraps the application with necessary providers
 */
function App() {
  return (
    <HashRouter>
      <AppRouter />
    </HashRouter>
  );
}

export default App;