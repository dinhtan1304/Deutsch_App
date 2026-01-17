/**
 * Database Connection
 * Sets up SQLite database connection using better-sqlite3 and Drizzle ORM
 * 
 * Note: This file will be used in the main process (Electron)
 * The renderer process will communicate via IPC
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';
import { app } from 'electron';

let db: ReturnType<typeof drizzle> | null = null;
let sqliteDb: Database.Database | null = null;

/**
 * Get the database file path
 * Stores in user data directory for persistence
 */
export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'deutschmeister.db');
}

/**
 * Initialize the database connection
 * Creates the database file if it doesn't exist
 */
export function initDatabase(): ReturnType<typeof drizzle> {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  
  // Create SQLite connection
  sqliteDb = new Database(dbPath);
  
  // Enable foreign keys
  sqliteDb.pragma('foreign_keys = ON');
  
  // Create Drizzle instance
  db = drizzle(sqliteDb, { schema });

  // Run migrations (create tables if they don't exist)
  initializeTables(sqliteDb);

  console.log(`[Database] Initialized at: ${dbPath}`);
  
  return db;
}

/**
 * Initialize database tables
 * Creates tables if they don't exist
 */
function initializeTables(sqlite: Database.Database): void {
  // Create profiles table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      avatar_path TEXT,
      current_level TEXT NOT NULL,
      target_level TEXT NOT NULL,
      daily_goal_minutes INTEGER NOT NULL,
      interface_language TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create settings table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'system',
      font_size TEXT NOT NULL DEFAULT 'medium',
      volume INTEGER NOT NULL DEFAULT 80,
      playback_speed TEXT NOT NULL DEFAULT '1.0',
      audio_quality TEXT NOT NULL DEFAULT 'high',
      daily_reminder_enabled INTEGER NOT NULL DEFAULT 1,
      daily_reminder_time TEXT DEFAULT '09:00',
      session_duration_minutes INTEGER NOT NULL DEFAULT 30,
      break_reminders_enabled INTEGER NOT NULL DEFAULT 1,
      auto_difficulty_enabled INTEGER NOT NULL DEFAULT 1,
      show_translations INTEGER NOT NULL DEFAULT 1,
      article_color_coding INTEGER NOT NULL DEFAULT 1,
      animation_speed TEXT NOT NULL DEFAULT 'normal',
      view_mode TEXT NOT NULL DEFAULT 'comfortable',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  console.log('[Database] Tables initialized');
}

/**
 * Get the database instance
 * Throws if not initialized
 */
export function getDatabase(): ReturnType<typeof drizzle> {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    db = null;
    console.log('[Database] Connection closed');
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}