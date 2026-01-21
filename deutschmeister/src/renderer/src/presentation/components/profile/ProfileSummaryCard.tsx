/**
 * Profile Summary Card Component
 * Displays a comprehensive overview of user profile and learning progress
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CEFRLevelInfo, CEFRLevel, getLevelRange } from '../../../domain/valueObjects/CEFRLevel';
import { LanguageInfo, Language } from '../../../domain/valueObjects/Language';
import { cn } from '../../../shared/utils/cn';

export interface ProfileSummaryData {
  id: string;
  displayName: string;
  avatarPath: string | null;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  dailyGoalMinutes: number;
  interfaceLanguage: Language;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSummaryCardProps {
  profile: ProfileSummaryData;
  onEditClick?: () => void;
  showEditButton?: boolean;
  compact?: boolean;
}

/**
 * Calculate learning progress percentage
 */
function calculateProgress(current: CEFRLevel, target: CEFRLevel): number {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levels.indexOf(current);
  const targetIndex = levels.indexOf(target);
  
  if (currentIndex >= targetIndex) return 100;
  if (targetIndex === 0) return 100;
  
  // Progress from A1 to target
  return Math.round((currentIndex / targetIndex) * 100);
}

/**
 * Get days since account creation
 */
function getDaysSinceCreation(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function ProfileSummaryCard({
  profile,
  onEditClick,
  showEditButton = true,
  compact = false
}: ProfileSummaryCardProps) {
  const progress = calculateProgress(profile.currentLevel, profile.targetLevel);
  const daysSinceCreation = getDaysSinceCreation(profile.createdAt);
  const levelRange = getLevelRange(profile.currentLevel, profile.targetLevel);

  // Avatar display
  const isBase64Image = profile.avatarPath?.startsWith('data:image');
  const avatarDisplay = profile.avatarPath ? (
    isBase64Image ? (
      <img
        src={profile.avatarPath}
        alt={profile.displayName}
        className={cn(
          'rounded-full object-cover',
          compact ? 'h-16 w-16' : 'h-24 w-24'
        )}
      />
    ) : (
      <span className={compact ? 'text-4xl' : 'text-6xl'}>{profile.avatarPath}</span>
    )
  ) : (
    <span className={compact ? 'text-4xl' : 'text-6xl'}>👤</span>
  );

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
              {avatarDisplay}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{profile.displayName}</h3>
              <p className="text-sm text-gray-500">
                {profile.currentLevel} → {profile.targetLevel} · {profile.dailyGoalMinutes} min/day
              </p>
            </div>

            {/* Edit Button */}
            {showEditButton && onEditClick && (
              <Button variant="ghost" size="sm" onClick={onEditClick}>
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile Summary</CardTitle>
          {showEditButton && onEditClick && (
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner">
            {avatarDisplay}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.displayName}</h2>
            <p className="mt-1 text-gray-500">
              Learning German for {daysSinceCreation} {daysSinceCreation === 1 ? 'day' : 'days'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {LanguageInfo[profile.interfaceLanguage].flag} {LanguageInfo[profile.interfaceLanguage].name}
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {profile.dailyGoalMinutes} min/day
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Learning Progress</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Level Steps */}
          <div className="flex justify-between">
            {levelRange.map((level, index) => {
              const isCurrentLevel = level === profile.currentLevel;
              const isTargetLevel = level === profile.targetLevel;
              const isPassed = index < levelRange.indexOf(profile.currentLevel);
              const isCurrent = isCurrentLevel;

              return (
                <div key={level} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all',
                      isTargetLevel && 'ring-2 ring-green-500 ring-offset-2',
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isPassed
                          ? 'bg-blue-200 text-blue-700'
                          : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {level}
                  </div>
                  <span className={cn(
                    'mt-1.5 text-xs',
                    isCurrent ? 'font-medium text-blue-600' : 'text-gray-500'
                  )}>
                    {CEFRLevelInfo[level].name}
                  </span>
                  {isCurrentLevel && (
                    <span className="mt-0.5 text-[10px] font-medium uppercase text-blue-600">
                      Current
                    </span>
                  )}
                  {isTargetLevel && !isCurrentLevel && (
                    <span className="mt-0.5 text-[10px] font-medium uppercase text-green-600">
                      Target
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{profile.currentLevel}</div>
            <div className="text-xs text-gray-600">Current Level</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{profile.targetLevel}</div>
            <div className="text-xs text-gray-600">Target Level</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{profile.dailyGoalMinutes}</div>
            <div className="text-xs text-gray-600">Min/Day Goal</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{daysSinceCreation}</div>
            <div className="text-xs text-gray-600">Days Active</div>
          </div>
        </div>

        {/* Account Info */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
            <span>
              <strong>Created:</strong> {formatDate(profile.createdAt)}
            </span>
            {profile.updatedAt !== profile.createdAt && (
              <span>
                <strong>Updated:</strong> {formatDate(profile.updatedAt)}
              </span>
            )}
            <span>
              <strong>ID:</strong> {profile.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}