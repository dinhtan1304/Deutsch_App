/**
 * Settings Repository Implementation
 * Implements ISettingsRepository using localStorage
 */

import { Settings, SettingsProps } from '../../domain/entities/Settings';
import { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';
import { PersistenceError } from '../../domain/errors/DomainErrors';
import { Theme } from '../../domain/valueObjects/Theme';

const STORAGE_KEY = 'deutschmeister_settings';

/**
 * Settings Repository using localStorage
 */
export class SettingsRepository implements ISettingsRepository {
  /**
   * Create new settings
   */
  async create(settings: Settings): Promise<Settings> {
    try {
      const existingData = localStorage.getItem(STORAGE_KEY);
      if (existingData) {
        const existing = JSON.parse(existingData);
        if (existing.profileId === settings.profileId) {
          throw new PersistenceError('create', 'Settings already exist for this profile');
        }
      }

      const data = settings.toObject();
      const serialized = this.serialize(data);
      localStorage.setItem(STORAGE_KEY, serialized);

      return settings;
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      throw new PersistenceError(
        'create',
        'Failed to create settings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update existing settings
   */
  async update(settings: Settings): Promise<Settings> {
    try {
      const data = settings.toObject();
      const serialized = this.serialize(data);
      localStorage.setItem(STORAGE_KEY, serialized);

      return settings;
    } catch (error) {
      throw new PersistenceError(
        'update',
        'Failed to update settings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get settings by profile ID
   */
  async getByProfileId(profileId: string): Promise<Settings | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return null;
      }

      const parsed = this.deserialize(data);
      if (parsed.profileId !== profileId) {
        return null;
      }

      return Settings.fromPersistence(parsed);
    } catch (error) {
      throw new PersistenceError(
        'read',
        'Failed to read settings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete settings by profile ID
   */
  async deleteByProfileId(profileId: string): Promise<boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return false;
      }

      const parsed = JSON.parse(data);
      if (parsed.profileId !== profileId) {
        return false;
      }

      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      throw new PersistenceError(
        'delete',
        'Failed to delete settings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if settings exist for a profile
   */
  async exists(profileId: string): Promise<boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return false;
      }

      const parsed = JSON.parse(data);
      return parsed.profileId === profileId;
    } catch {
      return false;
    }
  }

  /**
   * Serialize settings data for storage
   */
  private serialize(data: SettingsProps): string {
    return JSON.stringify({
      ...data,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString()
    });
  }

  /**
   * Deserialize settings data from storage
   */
  private deserialize(data: string): SettingsProps {
    const parsed = JSON.parse(data);
    return {
      id: parsed.id,
      profileId: parsed.profileId,
      theme: parsed.theme as Theme,
      fontSize: parsed.fontSize,
      volume: parsed.volume,
      playbackSpeed: parsed.playbackSpeed,
      audioQuality: parsed.audioQuality,
      dailyReminderEnabled: parsed.dailyReminderEnabled,
      dailyReminderTime: parsed.dailyReminderTime,
      sessionDurationMinutes: parsed.sessionDurationMinutes,
      breakRemindersEnabled: parsed.breakRemindersEnabled,
      autoDifficultyEnabled: parsed.autoDifficultyEnabled,
      showTranslations: parsed.showTranslations,
      articleColorCoding: parsed.articleColorCoding,
      animationSpeed: parsed.animationSpeed,
      viewMode: parsed.viewMode,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt)
    };
  }
}