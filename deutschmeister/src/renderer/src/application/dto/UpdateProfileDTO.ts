/**
 * Update Profile DTO
 * Data Transfer Object for updating an existing profile
 */

import { CEFRLevel } from '../../domain/valueObjects/CEFRLevel';
import { Language } from '../../domain/valueObjects/Language';

/**
 * Input DTO for updating a profile
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateProfileInputDTO {
  displayName?: string;
  avatarPath?: string | null;
  currentLevel?: CEFRLevel;
  targetLevel?: CEFRLevel;
  dailyGoalMinutes?: number;
  interfaceLanguage?: Language;
}

/**
 * Output DTO after profile is updated
 */
export interface UpdateProfileOutputDTO {
  id: string;
  displayName: string;
  avatarPath: string | null;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  dailyGoalMinutes: number;
  interfaceLanguage: Language;
  createdAt: string;
  updatedAt: string;
}

/**
 * Validation error structure
 */
export interface UpdateProfileValidationErrorDTO {
  field: string;
  message: string;
}

/**
 * Result wrapper for update profile operation
 */
export interface UpdateProfileResultDTO {
  success: boolean;
  data?: UpdateProfileOutputDTO;
  errors?: UpdateProfileValidationErrorDTO[];
}