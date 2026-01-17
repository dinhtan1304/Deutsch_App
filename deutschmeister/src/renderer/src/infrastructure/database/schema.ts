/**
 * Database Schema
 * Defines all database tables using Drizzle ORM
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Profiles Table
 * Stores user profile information
 */
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  avatarPath: text('avatar_path'),
  currentLevel: text('current_level').notNull(), // A1, A2, B1, B2, C1, C2
  targetLevel: text('target_level').notNull(),
  dailyGoalMinutes: integer('daily_goal_minutes').notNull(),
  interfaceLanguage: text('interface_language').notNull(), // en, vi, de
  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull()
});

/**
 * Settings Table
 * Stores user preferences and settings
 * Will be expanded in UC-1.2.x
 */
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  
  // General Settings
  theme: text('theme').notNull().default('system'), // light, dark, system
  fontSize: text('font_size').notNull().default('medium'), // small, medium, large
  
  // Audio Settings
  volume: integer('volume').notNull().default(80), // 0-100
  playbackSpeed: text('playback_speed').notNull().default('1.0'),
  audioQuality: text('audio_quality').notNull().default('high'),
  
  // Study Settings
  dailyReminderEnabled: integer('daily_reminder_enabled', { mode: 'boolean' }).notNull().default(true),
  dailyReminderTime: text('daily_reminder_time').default('09:00'),
  sessionDurationMinutes: integer('session_duration_minutes').notNull().default(30),
  breakRemindersEnabled: integer('break_reminders_enabled', { mode: 'boolean' }).notNull().default(true),
  autoDifficultyEnabled: integer('auto_difficulty_enabled', { mode: 'boolean' }).notNull().default(true),
  
  // Display Settings
  showTranslations: integer('show_translations', { mode: 'boolean' }).notNull().default(true),
  articleColorCoding: integer('article_color_coding', { mode: 'boolean' }).notNull().default(true),
  animationSpeed: text('animation_speed').notNull().default('normal'), // slow, normal, fast
  viewMode: text('view_mode').notNull().default('comfortable'), // compact, comfortable
  
  // Timestamps
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

/**
 * Type exports for use in repositories
 */
export type ProfileRecord = typeof profiles.$inferSelect;
export type NewProfileRecord = typeof profiles.$inferInsert;

export type SettingsRecord = typeof settings.$inferSelect;
export type NewSettingsRecord = typeof settings.$inferInsert;