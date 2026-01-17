/**
 * Create Profile Use Case
 * Handles the business logic for creating a new user profile
 */

import { v4 as uuidv4 } from 'uuid';
import { Profile } from '../../domain/entities/Profile';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { DuplicateError, ValidationError } from '../../domain/errors/DomainErrors';
import { isValidCEFRLevel, isValidTargetLevel } from '../../domain/valueObjects/CEFRLevel';
import { isValidLanguage } from '../../domain/valueObjects/Language';
import {
  CreateProfileInputDTO,
  CreateProfileOutputDTO,
  CreateProfileResultDTO,
  ProfileValidationErrorDTO
} from '../dto/CreateProfileDTO';

/**
 * Use Case: Create Profile
 * 
 * Responsibility:
 * - Validate input data
 * - Check business rules (no duplicate profiles for MVP)
 * - Create and persist the profile
 * - Return the created profile data
 */
export class CreateProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Execute the use case
   * @param input - The profile data from UI
   * @returns CreateProfileResultDTO with success status and data/errors
   */
  async execute(input: CreateProfileInputDTO): Promise<CreateProfileResultDTO> {
    // Step 1: Validate input
    const validationErrors = this.validateInput(input);
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      };
    }

    try {
      // Step 2: Check if profile already exists (MVP: only one profile allowed)
      const existingProfile = await this.profileRepository.exists();
      if (existingProfile) {
        throw new DuplicateError('Profile', 'A profile already exists. Only one profile is allowed.');
      }

      // Step 3: Create Profile entity
      const profile = Profile.create({
        id: uuidv4(),
        displayName: input.displayName,
        currentLevel: input.currentLevel,
        targetLevel: input.targetLevel,
        dailyGoalMinutes: input.dailyGoalMinutes,
        interfaceLanguage: input.interfaceLanguage,
        avatarPath: input.avatarPath || null
      });

      // Step 4: Persist to database
      const savedProfile = await this.profileRepository.create(profile);

      // Step 5: Return success result
      return {
        success: true,
        data: this.toOutputDTO(savedProfile)
      };
    } catch (error) {
      // Handle known errors
      if (error instanceof DuplicateError) {
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

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Validate all input fields
   * Returns array of validation errors (empty if valid)
   */
  private validateInput(input: CreateProfileInputDTO): ProfileValidationErrorDTO[] {
    const errors: ProfileValidationErrorDTO[] = [];

    // Validate display name
    const nameValidation = Profile.validateDisplayName(input.displayName);
    if (!nameValidation.isValid) {
      errors.push({
        field: 'displayName',
        message: nameValidation.error!
      });
    }

    // Validate current level
    if (!isValidCEFRLevel(input.currentLevel)) {
      errors.push({
        field: 'currentLevel',
        message: 'Please select a valid current level'
      });
    }

    // Validate target level
    if (!isValidCEFRLevel(input.targetLevel)) {
      errors.push({
        field: 'targetLevel',
        message: 'Please select a valid target level'
      });
    }

    // Validate target >= current
    if (
      isValidCEFRLevel(input.currentLevel) &&
      isValidCEFRLevel(input.targetLevel) &&
      !isValidTargetLevel(input.currentLevel, input.targetLevel)
    ) {
      errors.push({
        field: 'targetLevel',
        message: 'Target level must be equal to or higher than current level'
      });
    }

    // Validate daily goal
    const goalValidation = Profile.validateDailyGoal(input.dailyGoalMinutes);
    if (!goalValidation.isValid) {
      errors.push({
        field: 'dailyGoalMinutes',
        message: goalValidation.error!
      });
    }

    // Validate language
    if (!isValidLanguage(input.interfaceLanguage)) {
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
  private toOutputDTO(profile: Profile): CreateProfileOutputDTO {
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