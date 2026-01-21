/**
 * Dashboard Page
 * Main landing page after profile creation
 * This is a placeholder - will be fully implemented in UC-7.1.x
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useProfileStore } from '../../stores/profileStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useHistoryStore } from '../../stores/historyStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { ProfileSummaryCard } from '../../components/profile/ProfileSummaryCard';
import { ConfirmDeleteModal } from '../../components/profile/ConfirmDeleteModal';

export function DashboardPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const { deleteProfileAsync } = useProfileStore();
  const { initializeSettings } = useSettingsStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Initialize settings when profile loads
  useEffect(() => {
    if (profile?.id) {
      initializeSettings(profile.id);
    }
  }, [profile?.id, initializeSettings]);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">No profile found. Please create one.</p>
      </div>
    );
  }

  const handleDeleteProfile = async () => {
    const success = await deleteProfileAsync();
    if (success) {
      // Navigate to home after successful deletion
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            🇩🇪 DeutschMeister
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            Settings
          </Button>
        </header>

        {/* Profile Summary Card - UC-1.1.07 */}
        <div className="mb-6">
          <ProfileSummaryCard
            profile={profile}
            onEditClick={() => setIsEditModalOpen(true)}
            showEditButton={true}
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Button 
                variant="outline" 
                className="h-24 flex-col"
                onClick={() => navigate('/words')}
              >
                <span className="text-2xl">📚</span>
                <span className="mt-2">Der/Die/Das</span>
                <span className="text-xs text-green-600">Ready!</span>
              </Button>

              <FavoritesButton onClick={() => navigate('/words/favorites')} />

              <HistoryButton onClick={() => navigate('/words/history')} />

              <Button variant="outline" className="h-24 flex-col" disabled>
                <span className="text-2xl">📖</span>
                <span className="mt-2">Grammar</span>
                <span className="text-xs text-gray-500">Coming soon</span>
              </Button>

              <Button variant="outline" className="h-24 flex-col" disabled>
                <span className="text-2xl">🎧</span>
                <span className="mt-2">Listening</span>
                <span className="text-xs text-gray-500">Coming soon</span>
              </Button>

              <Button variant="outline" className="h-24 flex-col" disabled>
                <span className="text-2xl">✍️</span>
                <span className="mt-2">Writing</span>
                <span className="text-xs text-gray-500">Coming soon</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-24 flex-col"
                onClick={() => navigate('/settings')}
              >
                <span className="text-2xl">⚙️</span>
                <span className="mt-2">Settings</span>
                <span className="text-xs text-gray-500">Preferences</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Developer Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">
              These options are for testing purposes only.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </Button>
              <Button
                variant="danger"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          console.log('Profile updated successfully!');
        }}
      />

      {/* Delete Confirmation Modal - UC-1.1.08 */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProfile}
        profileName={profile.displayName}
      />
    </div>
  );
}

/**
 * Favorites Button with count badge
 */
function FavoritesButton({ onClick }: { onClick: () => void }) {
  const count = useFavoritesStore(state => state.favoriteIds.length);
  
  return (
    <Button 
      variant="outline" 
      className="h-24 flex-col relative"
      onClick={onClick}
    >
      <span className="text-2xl">⭐</span>
      <span className="mt-2">Favorites</span>
      {count > 0 ? (
        <span className="text-xs text-yellow-600">{count} words</span>
      ) : (
        <span className="text-xs text-gray-500">No favorites</span>
      )}
      {count > 0 && (
        <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}

/**
 * History Button with count badge
 */
function HistoryButton({ onClick }: { onClick: () => void }) {
  const count = useHistoryStore(state => state.history.length);
  
  return (
    <Button 
      variant="outline" 
      className="h-24 flex-col relative"
      onClick={onClick}
    >
      <span className="text-2xl">🕐</span>
      <span className="mt-2">History</span>
      {count > 0 ? (
        <span className="text-xs text-gray-600">{count} viewed</span>
      ) : (
        <span className="text-xs text-gray-500">No history</span>
      )}
      {count > 0 && (
        <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gray-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}