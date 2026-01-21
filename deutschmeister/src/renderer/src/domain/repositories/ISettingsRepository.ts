/**
 * Settings Repository Interface
 * Defines the contract for Settings persistence operations
 */

import { Settings } from '../entities/Settings';

export interface ISettingsRepository {
  /**
   * Create new settings for a profile
   */
  create(settings: Settings): Promise<Settings>;

  /**
   * Update existing settings
   */
  update(settings: Settings): Promise<Settings>;

  /**
   * Get settings by profile ID
   */
  getByProfileId(profileId: string): Promise<Settings | null>;

  /**
   * Delete settings by profile ID
   */
  deleteByProfileId(profileId: string): Promise<boolean>;

  /**
   * Check if settings exist for a profile
   */
  exists(profileId: string): Promise<boolean>;
}