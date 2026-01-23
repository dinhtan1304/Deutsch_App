/**
 * App Router
 * Main application routing configuration
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CreateProfilePage } from './presentation/pages/onboarding/CreateProfilePage';
import { DashboardPage } from './presentation/pages/home/DashboardPage';
import { SettingsPage } from './presentation/pages/settings/SettingsPage';
import { WordSearchPage } from './presentation/pages/words/WordSearchPage';
import { FavoritesPage } from './presentation/pages/words/FavoritesPage';
import { HistoryPage } from './presentation/pages/words/HistoryPage';
import { GameMenuPage, QuickQuizPage, FlashcardPage, FillBlankPage, TimedChallengePage } from './presentation/pages/games';
import { useHasCompletedOnboarding } from './presentation/stores/profileStore';


/**
 * Protected Route Component
 * Redirects to onboarding if no profile exists
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const hasProfile = useHasCompletedOnboarding();
  
  if (!hasProfile) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

/**
 * Onboarding Route Component
 * Redirects to dashboard if profile already exists
 */
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const hasProfile = useHasCompletedOnboarding();
  
  if (hasProfile) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

/**
 * App Routes
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Onboarding Routes */}
      <Route
        path="/"
        element={
          <OnboardingRoute>
            <CreateProfilePage />
          </OnboardingRoute>
        }
      />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      {/* Settings Route - UC-1.2.x */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Der/Die/Das Dictionary - UC-2.1.x */}
      <Route
        path="/articles"
        element={
          <ProtectedRoute>
            <WordSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/articles/search"
        element={
          <ProtectedRoute>
            <WordSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/words"
        element={
          <ProtectedRoute>
            <WordSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/words/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/words/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      
      {/* Games Routes - UC-2.2.x */}
      <Route
        path="/games"
        element={
          <ProtectedRoute>
            <GameMenuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/games/quiz"
        element={
          <ProtectedRoute>
            <QuickQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/games/quick-quiz"
        element={
          <ProtectedRoute>
            <QuickQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/games/flashcard"
        element={
          <ProtectedRoute>
            <FlashcardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/games/fill-blank"
        element={
          <ProtectedRoute>
            <FillBlankPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/games/timed-challenge"
        element={
          <ProtectedRoute>
            <TimedChallengePage />
          </ProtectedRoute>
        }
      />
      
      {/* Placeholder routes for future modules */}
      <Route
        path="/grammar/*"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Grammar Module" />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exam/*"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Exam Preparation Module" />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/listening/*"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Listening Module" />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/writing/*"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Writing Module" />
          </ProtectedRoute>
        }
      />
      
      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Placeholder Page for future modules
 */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-500">Coming soon...</p>
        <a
          href="/dashboard"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}