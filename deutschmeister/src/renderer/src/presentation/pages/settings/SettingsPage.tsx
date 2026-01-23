/**
 * Settings Page
 * Main settings page with all user preferences
 * Implements UC-1.2.01 to UC-1.2.18
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ThemeSelector } from '../../components/settings/ThemeSelector';
import { SettingToggle } from '../../components/settings/SettingToggle';
import { SettingSelect } from '../../components/settings/SettingSelect';
import { SettingSlider } from '../../components/settings/SettingSlider';
import { SettingSection } from '../../components/settings/SettingSection';
import { useSettingsStore, useSettings } from '../../stores/settingsStore';
import { useProfile } from '../../stores/profileStore';
import { 
  FONT_SIZES, 
  AUDIO_QUALITIES, 
  ANIMATION_SPEEDS, 
  VIEW_MODES,
  PLAYBACK_SPEEDS 
} from '../../../domain/entities/Settings';

export function SettingsPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const settings = useSettings();
  const {
    initializeSettings,
    setFontSize,
    setVolume,
    setPlaybackSpeed,
    setAudioQuality,
    setDailyReminder,
    setSessionDuration,
    setBreakReminders,
    setAutoDifficulty,
    setShowTranslations,
    setArticleColorCoding,
    setAnimationSpeed,
    setViewMode,
    resetToDefaults
  } = useSettingsStore();

  // Initialize settings when profile is available
  useEffect(() => {
    if (profile?.id) {
      initializeSettings(profile.id);
    }
  }, [profile?.id, initializeSettings]);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Please create a profile first.</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Font size options
  const fontSizeOptions = FONT_SIZES.map(size => ({
    value: size,
    label: size.charAt(0).toUpperCase() + size.slice(1)
  }));

  // Audio quality options
  const audioQualityOptions = AUDIO_QUALITIES.map(quality => ({
    value: quality,
    label: quality.charAt(0).toUpperCase() + quality.slice(1)
  }));

  // Playback speed options
  const playbackSpeedOptions = PLAYBACK_SPEEDS.map(speed => ({
    value: speed,
    label: `${speed}x`
  }));

  // Animation speed options
  const animationSpeedOptions = ANIMATION_SPEEDS.map(speed => ({
    value: speed,
    label: speed.charAt(0).toUpperCase() + speed.slice(1)
  }));

  // View mode options
  const viewModeOptions = VIEW_MODES.map(mode => ({
    value: mode,
    label: mode.charAt(0).toUpperCase() + mode.slice(1)
  }));

  // Session duration options
  const sessionDurationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '120 minutes' }
  ];

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
          >
            Reset to Defaults
          </Button>
        </div>
      </header>

      {/* Settings Content */}
      <div className="mx-auto max-w-3xl px-6 pt-6 space-y-6">
        
        {/* UC-1.2.01 & UC-1.2.02: General Settings */}
        <SettingSection
          title="General"
          description="Appearance and display preferences"
          icon="🎨"
        >
          {/* Theme Selector - UC-1.2.01 */}
          <ThemeSelector />
          
          {/* Font Size - UC-1.2.02 */}
          <SettingSelect
            label="Font Size"
            description="Adjust text size throughout the app"
            value={settings.fontSize}
            options={fontSizeOptions}
            onChange={(value) => setFontSize(value as typeof settings.fontSize)}
          />
        </SettingSection>

        {/* UC-1.2.04 - UC-1.2.07: Audio Settings */}
        <SettingSection
          title="Audio"
          description="Sound and playback settings"
          icon="🔊"
        >
          {/* Volume - UC-1.2.04 */}
          <SettingSlider
            label="Volume"
            description="Master volume for audio playback"
            value={settings.volume}
            min={0}
            max={100}
            unit="%"
            onChange={(value) => setVolume(value)}
          />
          
          {/* Playback Speed - UC-1.2.05 */}
          <SettingSelect
            label="Playback Speed"
            description="Default speed for audio and video"
            value={settings.playbackSpeed}
            options={playbackSpeedOptions}
            onChange={(value) => setPlaybackSpeed(value as typeof settings.playbackSpeed)}
          />
          
          {/* Audio Quality - UC-1.2.06 */}
          <SettingSelect
            label="Audio Quality"
            description="Higher quality uses more storage"
            value={settings.audioQuality}
            options={audioQualityOptions}
            onChange={(value) => setAudioQuality(value as typeof settings.audioQuality)}
          />
        </SettingSection>

        {/* UC-1.2.08 - UC-1.2.11: Study Settings */}
        <SettingSection
          title="Study"
          description="Learning and reminder preferences"
          icon="📚"
        >
          {/* Daily Reminder - UC-1.2.08 */}
          <SettingToggle
            label="Daily Reminder"
            description="Get reminded to study every day"
            checked={settings.dailyReminderEnabled}
            onChange={(checked) => setDailyReminder(checked)}
          />
          
          {settings.dailyReminderEnabled && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Reminder Time</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">When to send the daily reminder</p>
                </div>
                <input
                  type="time"
                  value={settings.dailyReminderTime}
                  onChange={(e) => setDailyReminder(true, e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
          
          {/* Session Duration - UC-1.2.09 */}
          <SettingSelect
            label="Session Duration"
            description="Default study session length"
            value={String(settings.sessionDurationMinutes)}
            options={sessionDurationOptions}
            onChange={(value) => setSessionDuration(Number(value))}
          />
          
          {/* Break Reminders - UC-1.2.10 */}
          <SettingToggle
            label="Break Reminders"
            description="Get reminded to take breaks during long sessions"
            checked={settings.breakRemindersEnabled}
            onChange={(checked) => setBreakReminders(checked)}
          />
          
          {/* Auto Difficulty - UC-1.2.11 */}
          <SettingToggle
            label="Auto Difficulty Adjustment"
            description="Automatically adjust difficulty based on performance"
            checked={settings.autoDifficultyEnabled}
            onChange={(checked) => setAutoDifficulty(checked)}
          />
        </SettingSection>

        {/* UC-1.2.12 - UC-1.2.15: Display Settings */}
        <SettingSection
          title="Display"
          description="Content display preferences"
          icon="👁️"
        >
          {/* Show Translations - UC-1.2.12 */}
          <SettingToggle
            label="Show Translations"
            description="Display translations alongside German text"
            checked={settings.showTranslations}
            onChange={(checked) => setShowTranslations(checked)}
          />
          
          {/* Article Color Coding - UC-1.2.13 */}
          <SettingToggle
            label="Article Color Coding"
            description="Color-code der/die/das for easier learning"
            checked={settings.articleColorCoding}
            onChange={(checked) => setArticleColorCoding(checked)}
          />
          
          {/* Animation Speed - UC-1.2.14 */}
          <SettingSelect
            label="Animation Speed"
            description="Speed of UI animations"
            value={settings.animationSpeed}
            options={animationSpeedOptions}
            onChange={(value) => setAnimationSpeed(value as typeof settings.animationSpeed)}
          />
          
          {/* View Mode - UC-1.2.15 */}
          <SettingSelect
            label="View Mode"
            description="Compact shows more content, comfortable is easier to read"
            value={settings.viewMode}
            options={viewModeOptions}
            onChange={(value) => setViewMode(value as typeof settings.viewMode)}
          />
        </SettingSection>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p><strong>DeutschMeister</strong> v1.0.0</p>
            <p>A comprehensive German learning application</p>
            <p className="text-xs text-gray-400">
              Settings last updated: {new Date(settings.updatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}