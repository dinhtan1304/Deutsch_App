/**
 * Profile Repository Interface
 * Defines the contract for Profile persistence operations
 * Following the Repository pattern from Clean Architecture
 */

import { Profile } from '../entities/Profile';

export interface IProfileRepository {
  /**
   * Save a new profile to the database
   * @param profile - The profile entity to save
   * @returns Promise<Profile> - The saved profile
   * @throws Error if profile already exists or save fails
   */
  create(profile: Profile): Promise<Profile>;

  /**
   * Update an existing profile
   * @param profile - The profile entity with updated data
   * @returns Promise<Profile> - The updated profile
   * @throws Error if profile doesn't exist or update fails
   */
  update(profile: Profile): Promise<Profile>;

  /**
   * Find profile by ID
   * @param id - The profile ID
   * @returns Promise<Profile | null> - The profile or null if not found
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * Get the current active profile
   * For MVP, there's only one profile per app instance
   * @returns Promise<Profile | null> - The active profile or null if none exists
   */
  getActive(): Promise<Profile | null>;

  /**
   * Check if a profile exists
   * @returns Promise<boolean> - True if at least one profile exists
   */
  exists(): Promise<boolean>;

  /**
   * Delete a profile by ID
   * @param id - The profile ID to delete
   * @returns Promise<boolean> - True if deleted successfully
   */
  delete(id: string): Promise<boolean>;

  /**
   * Delete all profiles (for reset functionality)
   * @returns Promise<void>
   */
  deleteAll(): Promise<void>;
}