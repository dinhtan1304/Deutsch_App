/**
 * App Router
 * Main application routing configuration
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CreateProfilePage } from './presentation/pages/onboarding/CreateProfilePage';
import { DashboardPage } from './presentation/pages/home/DashboardPage';
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
      
      {/* Placeholder routes for future modules */}
      <Route
        path="/articles/*"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Der/Die/Das Module" />
          </ProtectedRoute>
        }
      />
      
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
      
      <Route
        path="/settings/*"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Settings" />
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