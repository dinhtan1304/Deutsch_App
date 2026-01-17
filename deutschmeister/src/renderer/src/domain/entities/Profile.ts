/**
 * Profile Entity
 * Represents a user's profile in the DeutschMeister application
 */

import { CEFRLevel, isValidTargetLevel } from '../valueObjects/CEFRLevel';
import { Language } from '../valueObjects/Language';

export interface ProfileProps {
  id: string;
  displayName: string;
  avatarPath: string | null;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  dailyGoalMinutes: number;
  interfaceLanguage: Language;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileProps {
  id: string;
  displayName: string;
  avatarPath?: string | null;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  dailyGoalMinutes: number;
  interfaceLanguage: Language;
}

/**
 * Profile Validation Rules
 */
export const ProfileValidation = {
  displayName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\u00C0-\u024F\u1E00-\u1EFF]+$/ // Alphanumeric + accents
  },
  dailyGoalMinutes: {
    min: 5,
    max: 480 // 8 hours
  },
  avatar: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
  }
} as const;

/**
 * Profile Entity Class
 */
export class Profile {
  private readonly props: ProfileProps;

  private constructor(props: ProfileProps) {
    this.props = props;
  }

  /**
   * Create a new Profile
   * Validates all business rules before creation
   */
  static create(props: CreateProfileProps): Profile {
    // Validate display name
    const nameValidation = Profile.validateDisplayName(props.displayName);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    // Validate target level >= current level
    if (!isValidTargetLevel(props.currentLevel, props.targetLevel)) {
      throw new Error('Target level must be equal to or higher than current level');
    }

    // Validate daily goal
    const goalValidation = Profile.validateDailyGoal(props.dailyGoalMinutes);
    if (!goalValidation.isValid) {
      throw new Error(goalValidation.error);
    }

    const now = new Date();

    return new Profile({
      id: props.id,
      displayName: props.displayName.trim(),
      avatarPath: props.avatarPath || null,
      currentLevel: props.currentLevel,
      targetLevel: props.targetLevel,
      dailyGoalMinutes: props.dailyGoalMinutes,
      interfaceLanguage: props.interfaceLanguage,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstruct Profile from database
   * Skips validation (assumes data is already valid)
   */
  static fromPersistence(props: ProfileProps): Profile {
    return new Profile({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt)
    });
  }

  /**
   * Validate display name
   */
  static validateDisplayName(name: string): { isValid: boolean; error?: string } {
    const trimmedName = name.trim();
    const { minLength, maxLength, pattern } = ProfileValidation.displayName;

    if (trimmedName.length < minLength) {
      return { 
        isValid: false, 
        error: `Display name must be at least ${minLength} characters` 
      };
    }

    if (trimmedName.length > maxLength) {
      return { 
        isValid: false, 
        error: `Display name must not exceed ${maxLength} characters` 
      };
    }

    if (!pattern.test(trimmedName)) {
      return { 
        isValid: false, 
        error: 'Display name can only contain letters, numbers, and spaces' 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate daily goal
   */
  static validateDailyGoal(minutes: number): { isValid: boolean; error?: string } {
    const { min, max } = ProfileValidation.dailyGoalMinutes;

    if (!Number.isInteger(minutes)) {
      return { isValid: false, error: 'Daily goal must be a whole number' };
    }

    if (minutes < min) {
      return { isValid: false, error: `Daily goal must be at least ${min} minutes` };
    }

    if (minutes > max) {
      return { isValid: false, error: `Daily goal must not exceed ${max} minutes` };
    }

    return { isValid: true };
  }

  /**
   * Validate avatar file
   */
  static validateAvatarFile(file: File): { isValid: boolean; error?: string } {
    const { maxSizeBytes, allowedFormats } = ProfileValidation.avatar;

    if (file.size > maxSizeBytes) {
      return { 
        isValid: false, 
        error: `Avatar file must not exceed ${maxSizeBytes / (1024 * 1024)}MB` 
      };
    }

    const extensions = file.name.split('.').pop()?.toLowerCase();
    if (!extensions || !allowedFormats.includes(extensions as any)) {
      return { 
        isValid: false, 
        error: `Avatar must be one of: ${allowedFormats.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get avatarPath(): string | null {
    return this.props.avatarPath;
  }

  get currentLevel(): CEFRLevel {
    return this.props.currentLevel;
  }

  get targetLevel(): CEFRLevel {
    return this.props.targetLevel;
  }

  get dailyGoalMinutes(): number {
    return this.props.dailyGoalMinutes;
  }

  get interfaceLanguage(): Language {
    return this.props.interfaceLanguage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): ProfileProps {
    return { ...this.props };
  }

  /**
   * Update display name
   */
  updateDisplayName(name: string): Profile {
    const validation = Profile.validateDisplayName(name);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return new Profile({
      ...this.props,
      displayName: name.trim(),
      updatedAt: new Date()
    });
  }

  /**
   * Update avatar
   */
  updateAvatar(avatarPath: string | null): Profile {
    return new Profile({
      ...this.props,
      avatarPath,
      updatedAt: new Date()
    });
  }

  /**
   * Update learning levels
   */
  updateLevels(currentLevel: CEFRLevel, targetLevel: CEFRLevel): Profile {
    if (!isValidTargetLevel(currentLevel, targetLevel)) {
      throw new Error('Target level must be equal to or higher than current level');
    }

    return new Profile({
      ...this.props,
      currentLevel,
      targetLevel,
      updatedAt: new Date()
    });
  }

  /**
   * Update daily goal
   */
  updateDailyGoal(minutes: number): Profile {
    const validation = Profile.validateDailyGoal(minutes);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return new Profile({
      ...this.props,
      dailyGoalMinutes: minutes,
      updatedAt: new Date()
    });
  }

  /**
   * Update interface language
   */
  updateLanguage(language: Language): Profile {
    return new Profile({
      ...this.props,
      interfaceLanguage: language,
      updatedAt: new Date()
    });
  }
}