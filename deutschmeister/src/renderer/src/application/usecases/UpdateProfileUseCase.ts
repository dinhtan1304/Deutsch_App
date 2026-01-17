/**
 * Update Profile Use Case
 * Handles the business logic for updating an existing user profile
 */

import { Profile } from '../../domain/entities/Profile';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainErrors';
import { isValidCEFRLevel, isValidTargetLevel, CEFRLevel } from '../../domain/valueObjects/CEFRLevel';
import { isValidLanguage } from '../../domain/valueObjects/Language';
import {
  UpdateProfileInputDTO,
  UpdateProfileOutputDTO,
  UpdateProfileResultDTO,
  UpdateProfileValidationErrorDTO
} from '../dto/UpdateProfileDTO';

/**
 * Use Case: Update Profile
 * 
 * Responsibility:
 * - Validate input data
 * - Check that profile exists
 * - Update only provided fields
 * - Persist changes
 * - Return updated profile data
 */
export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Execute the use case
   * @param input - The profile data to update (partial)
   * @returns UpdateProfileResultDTO with success status and data/errors
   */
  async execute(input: UpdateProfileInputDTO): Promise<UpdateProfileResultDTO> {
    try {
      // Step 1: Get existing profile
      const existingProfile = await this.profileRepository.getActive();
      if (!existingProfile) {
        throw new NotFoundError('Profile');
      }

      // Step 2: Validate input
      const validationErrors = this.validateInput(input, existingProfile);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      // Step 3: Apply updates to profile
      let updatedProfile = existingProfile;

      if (input.displayName !== undefined) {
        updatedProfile = updatedProfile.updateDisplayName(input.displayName);
      }

      if (input.avatarPath !== undefined) {
        updatedProfile = updatedProfile.updateAvatar(input.avatarPath);
      }

      if (input.currentLevel !== undefined || input.targetLevel !== undefined) {
        const newCurrentLevel = input.currentLevel ?? existingProfile.currentLevel;
        const newTargetLevel = input.targetLevel ?? existingProfile.targetLevel;
        updatedProfile = updatedProfile.updateLevels(newCurrentLevel, newTargetLevel);
      }

      if (input.dailyGoalMinutes !== undefined) {
        updatedProfile = updatedProfile.updateDailyGoal(input.dailyGoalMinutes);
      }

      if (input.interfaceLanguage !== undefined) {
        updatedProfile = updatedProfile.updateLanguage(input.interfaceLanguage);
      }

      // Step 4: Persist changes
      const savedProfile = await this.profileRepository.update(updatedProfile);

      // Step 5: Return success result
      return {
        success: true,
        data: this.toOutputDTO(savedProfile)
      };
    } catch (error) {
      // Handle known errors
      if (error instanceof NotFoundError) {
        return {
          success: false,
          errors: [{ field: 'general', message: error.message }]
        };
      }

      if (error instanceof ValidationError) {
        return {
          success: false,
          errors: [{ field: error.field || 'general', message: error.message }]
        };
      }

      // Handle Error instances
      if (error instanceof Error) {
        return {
          success: false,
          errors: [{ field: 'general', message: error.message }]
        };
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Validate input fields
   * Only validates fields that are provided
   */
  private validateInput(
    input: UpdateProfileInputDTO,
    existingProfile: Profile
  ): UpdateProfileValidationErrorDTO[] {
    const errors: UpdateProfileValidationErrorDTO[] = [];

    // Validate display name if provided
    if (input.displayName !== undefined) {
      const nameValidation = Profile.validateDisplayName(input.displayName);
      if (!nameValidation.isValid) {
        errors.push({
          field: 'displayName',
          message: nameValidation.error!
        });
      }
    }

    // Validate current level if provided
    if (input.currentLevel !== undefined && !isValidCEFRLevel(input.currentLevel)) {
      errors.push({
        field: 'currentLevel',
        message: 'Please select a valid current level'
      });
    }

    // Validate target level if provided
    if (input.targetLevel !== undefined && !isValidCEFRLevel(input.targetLevel)) {
      errors.push({
        field: 'targetLevel',
        message: 'Please select a valid target level'
      });
    }

    // Validate target >= current (considering both existing and new values)
    const effectiveCurrentLevel = input.currentLevel ?? existingProfile.currentLevel;
    const effectiveTargetLevel = input.targetLevel ?? existingProfile.targetLevel;
    
    if (
      isValidCEFRLevel(effectiveCurrentLevel) &&
      isValidCEFRLevel(effectiveTargetLevel) &&
      !isValidTargetLevel(effectiveCurrentLevel, effectiveTargetLevel)
    ) {
      errors.push({
        field: 'targetLevel',
        message: 'Target level must be equal to or higher than current level'
      });
    }

    // Validate daily goal if provided
    if (input.dailyGoalMinutes !== undefined) {
      const goalValidation = Profile.validateDailyGoal(input.dailyGoalMinutes);
      if (!goalValidation.isValid) {
        errors.push({
          field: 'dailyGoalMinutes',
          message: goalValidation.error!
        });
      }
    }

    // Validate language if provided
    if (input.interfaceLanguage !== undefined && !isValidLanguage(input.interfaceLanguage)) {
      errors.push({
        field: 'interfaceLanguage',
        message: 'Please select a valid language'
      });
    }

    return errors;
  }

  /**
   * Convert Profile entity to output DTO
   */
  private toOutputDTO(profile: Profile): UpdateProfileOutputDTO {
    return {
      id: profile.id,
      displayName: profile.displayName,
      avatarPath: profile.avatarPath,
      currentLevel: profile.currentLevel,
      targetLevel: profile.targetLevel,
      dailyGoalMinutes: profile.dailyGoalMinutes,
      interfaceLanguage: profile.interfaceLanguage,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString()
    };
  }
}