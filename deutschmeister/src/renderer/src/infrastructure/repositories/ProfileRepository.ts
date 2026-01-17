/**
 * Profile Repository Implementation
 * Implements IProfileRepository using localStorage for renderer process
 * 
 * Note: In production, this would communicate with main process via IPC
 * For MVP, we use localStorage for simplicity
 */

import { Profile, ProfileProps } from '../../domain/entities/Profile';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { PersistenceError } from '../../domain/errors/DomainErrors';
import { CEFRLevel } from '../../domain/valueObjects/CEFRLevel';
import { Language } from '../../domain/valueObjects/Language';

const STORAGE_KEY = 'deutschmeister_profile';

/**
 * Profile Repository using localStorage
 * Suitable for single-user desktop application
 */
export class ProfileRepository implements IProfileRepository {
  /**
   * Create a new profile
   */
  async create(profile: Profile): Promise<Profile> {
    try {
      const existingData = localStorage.getItem(STORAGE_KEY);
      if (existingData) {
        throw new PersistenceError('create', 'Profile already exists');
      }

      const data = profile.toObject();
      const serialized = this.serialize(data);
      localStorage.setItem(STORAGE_KEY, serialized);

      return profile;
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      throw new PersistenceError(
        'create',
        'Failed to create profile',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update an existing profile
   */
  async update(profile: Profile): Promise<Profile> {
    try {
      const existingData = localStorage.getItem(STORAGE_KEY);
      if (!existingData) {
        throw new PersistenceError('update', 'Profile not found');
      }

      const data = profile.toObject();
      const serialized = this.serialize(data);
      localStorage.setItem(STORAGE_KEY, serialized);

      return profile;
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      throw new PersistenceError(
        'update',
        'Failed to update profile',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find profile by ID
   */
  async findById(id: string): Promise<Profile | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return null;
      }

      const parsed = this.deserialize(data);
      if (parsed.id !== id) {
        return null;
      }

      return Profile.fromPersistence(parsed);
    } catch (error) {
      throw new PersistenceError(
        'read',
        'Failed to read profile',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the active profile
   * For MVP, there's only one profile
   */
  async getActive(): Promise<Profile | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return null;
      }

      const parsed = this.deserialize(data);
      return Profile.fromPersistence(parsed);
    } catch (error) {
      throw new PersistenceError(
        'read',
        'Failed to read active profile',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if any profile exists
   */
  async exists(): Promise<boolean> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data !== null;
  }

  /**
   * Delete a profile by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return false;
      }

      const parsed = this.deserialize(data);
      if (parsed.id !== id) {
        return false;
      }

      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      throw new PersistenceError(
        'delete',
        'Failed to delete profile',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete all profiles
   */
  async deleteAll(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Serialize profile data for storage
   */
  private serialize(data: ProfileProps): string {
    return JSON.stringify({
      ...data,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString()
    });
  }

  /**
   * Deserialize profile data from storage
   */
  private deserialize(data: string): ProfileProps {
    const parsed = JSON.parse(data);
    return {
      id: parsed.id,
      displayName: parsed.displayName,
      avatarPath: parsed.avatarPath,
      currentLevel: parsed.currentLevel as CEFRLevel,
      targetLevel: parsed.targetLevel as CEFRLevel,
      dailyGoalMinutes: parsed.dailyGoalMinutes,
      interfaceLanguage: parsed.interfaceLanguage as Language,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt)
    };
  }
}