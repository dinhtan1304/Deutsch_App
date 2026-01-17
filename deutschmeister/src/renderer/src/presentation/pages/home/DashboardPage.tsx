/**
 * Dashboard Page
 * Main landing page after profile creation
 * This is a placeholder - will be fully implemented in UC-7.1.x
 */

import React, { useState } from 'react';
import { useProfile, useProfileStore } from '../../stores/profileStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { CEFRLevelInfo } from '../../../domain/valueObjects/CEFRLevel';
import { LanguageInfo } from '../../../domain/valueObjects/Language';

export function DashboardPage() {
  const profile = useProfile();
  const { clearProfile } = useProfileStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">No profile found. Please create one.</p>
      </div>
    );
  }

  // Get avatar display
  const isBase64Image = profile.avatarPath?.startsWith('data:image');
  const avatarDisplay = profile.avatarPath ? (
    isBase64Image ? (
      <img
        src={profile.avatarPath}
        alt="Avatar"
        className="h-20 w-20 rounded-full object-cover"
      />
    ) : (
      <span className="text-5xl">{profile.avatarPath}</span>
    )
  ) : (
    <span className="text-5xl">👤</span>
  );

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
            onClick={() => setIsEditModalOpen(true)}
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

        {/* Welcome Card */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              {avatarDisplay}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">
                Welcome, {profile.displayName}! 🎉
              </h2>
              <p className="mt-1 text-gray-600">
                Ready to continue your German learning journey?
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Learning Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-sm text-gray-600">Current Level</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {profile.currentLevel}
                </p>
                <p className="text-xs text-gray-500">
                  {CEFRLevelInfo[profile.currentLevel].name}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-sm text-gray-600">Target Level</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {profile.targetLevel}
                </p>
                <p className="text-xs text-gray-500">
                  {CEFRLevelInfo[profile.targetLevel].name}
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <p className="text-sm text-gray-600">Daily Goal</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">
                  {profile.dailyGoalMinutes}
                </p>
                <p className="text-xs text-gray-500">minutes/day</p>
              </div>

              <div className="rounded-lg bg-orange-50 p-4 text-center">
                <p className="text-sm text-gray-600">Language</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">
                  {LanguageInfo[profile.interfaceLanguage].flag}
                </p>
                <p className="text-xs text-gray-500">
                  {LanguageInfo[profile.interfaceLanguage].name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Placeholder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-24 flex-col" disabled>
                <span className="text-2xl">📚</span>
                <span className="mt-2">Der/Die/Das</span>
                <span className="text-xs text-gray-500">Coming soon</span>
              </Button>

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

              <Button variant="outline" className="h-24 flex-col" disabled>
                <span className="text-2xl">📝</span>
                <span className="mt-2">Exam Prep</span>
                <span className="text-xs text-gray-500">Coming soon</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-24 flex-col"
                onClick={() => setIsEditModalOpen(true)}
              >
                <span className="text-2xl">⚙️</span>
                <span className="mt-2">Settings</span>
                <span className="text-xs text-gray-500">Edit profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug: Reset Profile */}
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
                onClick={() => {
                  if (confirm('Are you sure you want to delete your profile? This cannot be undone.')) {
                    localStorage.removeItem('deutschmeister_profile');
                    clearProfile();
                    window.location.href = '/';
                  }
                }}
              >
                Reset Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            Profile created: {new Date(profile.createdAt).toLocaleDateString()}
            {profile.updatedAt !== profile.createdAt && (
              <> · Last updated: {new Date(profile.updatedAt).toLocaleDateString()}</>
            )}
          </p>
        </footer>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          // Optional: Show success toast
          console.log('Profile updated successfully!');
        }}
      />
    </div>
  );
}