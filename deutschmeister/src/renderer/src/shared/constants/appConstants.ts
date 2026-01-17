/**
 * Application Constants
 * Centralized constants used throughout the application
 */

/**
 * Application info
 */
export const APP_NAME = 'DeutschMeister';
export const APP_VERSION = '1.0.0';

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  PROFILE: 'deutschmeister_profile',
  SETTINGS: 'deutschmeister_settings',
  PROFILE_STORE: 'deutschmeister-profile-store'
} as const;

/**
 * Route paths
 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ARTICLES: '/articles',
  GRAMMAR: '/grammar',
  EXAM: '/exam',
  LISTENING: '/listening',
  WRITING: '/writing',
  SETTINGS: '/settings',
  PROGRESS: '/progress'
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  DAILY_GOAL_MINUTES: 30,
  CURRENT_LEVEL: 'A1',
  TARGET_LEVEL: 'B1',
  INTERFACE_LANGUAGE: 'en',
  THEME: 'system',
  FONT_SIZE: 'medium',
  VOLUME: 80,
  PLAYBACK_SPEED: '1.0'
} as const;

/**
 * Limits
 */
export const LIMITS = {
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 50,
  DAILY_GOAL_MIN: 5,
  DAILY_GOAL_MAX: 480,
  AVATAR_MAX_SIZE_MB: 2
} as const;

/**
 * Time intervals (in milliseconds)
 */
export const INTERVALS = {
  AUTO_SAVE: 30000, // 30 seconds
  REMINDER_CHECK: 60000, // 1 minute
  SYNC_CHECK: 300000 // 5 minutes
} as const;