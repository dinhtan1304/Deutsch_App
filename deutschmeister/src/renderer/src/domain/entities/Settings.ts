/**
 * Settings Entity
 * Represents user preferences and settings
 */

import { Theme, isValidTheme } from '../valueObjects/Theme';

/**
 * Font size options
 */
export const FONT_SIZES = ['small', 'medium', 'large'] as const;
export type FontSize = (typeof FONT_SIZES)[number];

/**
 * Audio quality options
 */
export const AUDIO_QUALITIES = ['low', 'medium', 'high'] as const;
export type AudioQuality = (typeof AUDIO_QUALITIES)[number];

/**
 * Animation speed options
 */
export const ANIMATION_SPEEDS = ['slow', 'normal', 'fast'] as const;
export type AnimationSpeed = (typeof ANIMATION_SPEEDS)[number];

/**
 * View mode options
 */
export const VIEW_MODES = ['compact', 'comfortable'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/**
 * Playback speed options
 */
export const PLAYBACK_SPEEDS = ['0.5', '0.75', '1.0', '1.25', '1.5', '1.75', '2.0'] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/**
 * Settings properties interface
 */
export interface SettingsProps {
  id: string;
  profileId: string;
  
  // General Settings
  theme: Theme;
  fontSize: FontSize;
  
  // Audio Settings
  volume: number; // 0-100
  playbackSpeed: PlaybackSpeed;
  audioQuality: AudioQuality;
  
  // Study Settings
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:mm format
  sessionDurationMinutes: number;
  breakRemindersEnabled: boolean;
  autoDifficultyEnabled: boolean;
  
  // Display Settings
  showTranslations: boolean;
  articleColorCoding: boolean;
  animationSpeed: AnimationSpeed;
  viewMode: ViewMode;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Omit<SettingsProps, 'id' | 'profileId' | 'createdAt' | 'updatedAt'> = {
  // General
  theme: 'system',
  fontSize: 'medium',
  
  // Audio
  volume: 80,
  playbackSpeed: '1.0',
  audioQuality: 'high',
  
  // Study
  dailyReminderEnabled: true,
  dailyReminderTime: '09:00',
  sessionDurationMinutes: 30,
  breakRemindersEnabled: true,
  autoDifficultyEnabled: true,
  
  // Display
  showTranslations: true,
  articleColorCoding: true,
  animationSpeed: 'normal',
  viewMode: 'comfortable'
};

/**
 * Settings validation rules
 */
export const SettingsValidation = {
  volume: { min: 0, max: 100 },
  sessionDurationMinutes: { min: 5, max: 120 },
  reminderTime: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
} as const;

/**
 * Settings Entity Class
 */
export class Settings {
  private readonly props: SettingsProps;

  private constructor(props: SettingsProps) {
    this.props = props;
  }

  /**
   * Create new settings with defaults
   */
  static createDefault(id: string, profileId: string): Settings {
    const now = new Date();
    return new Settings({
      id,
      profileId,
      ...DEFAULT_SETTINGS,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Create settings from props
   */
  static create(props: SettingsProps): Settings {
    return new Settings(props);
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: SettingsProps): Settings {
    return new Settings({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt)
    });
  }

  // Getters
  get id(): string { return this.props.id; }
  get profileId(): string { return this.props.profileId; }
  get theme(): Theme { return this.props.theme; }
  get fontSize(): FontSize { return this.props.fontSize; }
  get volume(): number { return this.props.volume; }
  get playbackSpeed(): PlaybackSpeed { return this.props.playbackSpeed; }
  get audioQuality(): AudioQuality { return this.props.audioQuality; }
  get dailyReminderEnabled(): boolean { return this.props.dailyReminderEnabled; }
  get dailyReminderTime(): string { return this.props.dailyReminderTime; }
  get sessionDurationMinutes(): number { return this.props.sessionDurationMinutes; }
  get breakRemindersEnabled(): boolean { return this.props.breakRemindersEnabled; }
  get autoDifficultyEnabled(): boolean { return this.props.autoDifficultyEnabled; }
  get showTranslations(): boolean { return this.props.showTranslations; }
  get articleColorCoding(): boolean { return this.props.articleColorCoding; }
  get animationSpeed(): AnimationSpeed { return this.props.animationSpeed; }
  get viewMode(): ViewMode { return this.props.viewMode; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Convert to plain object
   */
  toObject(): SettingsProps {
    return { ...this.props };
  }

  /**
   * Update theme
   */
  updateTheme(theme: Theme): Settings {
    if (!isValidTheme(theme)) {
      throw new Error('Invalid theme value');
    }
    return new Settings({
      ...this.props,
      theme,
      updatedAt: new Date()
    });
  }

  /**
   * Update font size
   */
  updateFontSize(fontSize: FontSize): Settings {
    if (!FONT_SIZES.includes(fontSize)) {
      throw new Error('Invalid font size value');
    }
    return new Settings({
      ...this.props,
      fontSize,
      updatedAt: new Date()
    });
  }

  /**
   * Update volume
   */
  updateVolume(volume: number): Settings {
    const { min, max } = SettingsValidation.volume;
    if (volume < min || volume > max) {
      throw new Error(`Volume must be between ${min} and ${max}`);
    }
    return new Settings({
      ...this.props,
      volume: Math.round(volume),
      updatedAt: new Date()
    });
  }

  /**
   * Update playback speed
   */
  updatePlaybackSpeed(playbackSpeed: PlaybackSpeed): Settings {
    if (!PLAYBACK_SPEEDS.includes(playbackSpeed)) {
      throw new Error('Invalid playback speed value');
    }
    return new Settings({
      ...this.props,
      playbackSpeed,
      updatedAt: new Date()
    });
  }

  /**
   * Update audio quality
   */
  updateAudioQuality(audioQuality: AudioQuality): Settings {
    if (!AUDIO_QUALITIES.includes(audioQuality)) {
      throw new Error('Invalid audio quality value');
    }
    return new Settings({
      ...this.props,
      audioQuality,
      updatedAt: new Date()
    });
  }

  /**
   * Update daily reminder settings
   */
  updateDailyReminder(enabled: boolean, time?: string): Settings {
    if (time && !SettingsValidation.reminderTime.test(time)) {
      throw new Error('Invalid time format. Use HH:mm');
    }
    return new Settings({
      ...this.props,
      dailyReminderEnabled: enabled,
      dailyReminderTime: time ?? this.props.dailyReminderTime,
      updatedAt: new Date()
    });
  }

  /**
   * Update session duration
   */
  updateSessionDuration(minutes: number): Settings {
    const { min, max } = SettingsValidation.sessionDurationMinutes;
    if (minutes < min || minutes > max) {
      throw new Error(`Session duration must be between ${min} and ${max} minutes`);
    }
    return new Settings({
      ...this.props,
      sessionDurationMinutes: minutes,
      updatedAt: new Date()
    });
  }

  /**
   * Update break reminders
   */
  updateBreakReminders(enabled: boolean): Settings {
    return new Settings({
      ...this.props,
      breakRemindersEnabled: enabled,
      updatedAt: new Date()
    });
  }

  /**
   * Update auto difficulty
   */
  updateAutoDifficulty(enabled: boolean): Settings {
    return new Settings({
      ...this.props,
      autoDifficultyEnabled: enabled,
      updatedAt: new Date()
    });
  }

  /**
   * Update show translations
   */
  updateShowTranslations(show: boolean): Settings {
    return new Settings({
      ...this.props,
      showTranslations: show,
      updatedAt: new Date()
    });
  }

  /**
   * Update article color coding
   */
  updateArticleColorCoding(enabled: boolean): Settings {
    return new Settings({
      ...this.props,
      articleColorCoding: enabled,
      updatedAt: new Date()
    });
  }

  /**
   * Update animation speed
   */
  updateAnimationSpeed(speed: AnimationSpeed): Settings {
    if (!ANIMATION_SPEEDS.includes(speed)) {
      throw new Error('Invalid animation speed value');
    }
    return new Settings({
      ...this.props,
      animationSpeed: speed,
      updatedAt: new Date()
    });
  }

  /**
   * Update view mode
   */
  updateViewMode(mode: ViewMode): Settings {
    if (!VIEW_MODES.includes(mode)) {
      throw new Error('Invalid view mode value');
    }
    return new Settings({
      ...this.props,
      viewMode: mode,
      updatedAt: new Date()
    });
  }

  /**
   * Update multiple settings at once
   */
  updateMultiple(updates: Partial<Omit<SettingsProps, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>): Settings {
    return new Settings({
      ...this.props,
      ...updates,
      updatedAt: new Date()
    });
  }
}