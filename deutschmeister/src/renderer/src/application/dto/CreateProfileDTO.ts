/**
 * Create Profile DTO
 * Data Transfer Object for creating a new profile
 */

import { CEFRLevel } from '../../domain/valueObjects/CEFRLevel';
import { Language } from '../../domain/valueObjects/Language';

/**
 * Input DTO for creating a profile
 * This is what the UI sends to the use case
 */
export interface CreateProfileInputDTO {
  displayName: string;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  dailyGoalMinutes: number;
  interfaceLanguage: Language;
  avatarPath?: string | null;
}

/**
 * Output DTO after profile is created
 * This is what the use case returns to the UI
 */
export interface CreateProfileOutputDTO {
  id: string;
  displayName: string;
  avatarPath: string | null;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  dailyGoalMinutes: number;
  interfaceLanguage: Language;
  createdAt: string; // ISO string for serialization
  updatedAt: string;
}

/**
 * Validation error structure
 */
export interface ProfileValidationErrorDTO {
  field: string;
  message: string;
}

/**
 * Result wrapper for create profile operation
 */
export interface CreateProfileResultDTO {
  success: boolean;
  data?: CreateProfileOutputDTO;
  errors?: ProfileValidationErrorDTO[];
}