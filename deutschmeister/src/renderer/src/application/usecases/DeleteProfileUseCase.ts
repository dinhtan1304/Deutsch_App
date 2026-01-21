/**
 * Delete Profile Use Case
 * Handles the business logic for deleting a user profile
 */

import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { NotFoundError, PersistenceError } from '../../domain/errors/DomainErrors';
import {
  DeleteProfileInputDTO,
  DeleteProfileResultDTO
} from '../dto/DeleteProfileDTO';

/**
 * Use Case: Delete Profile
 * 
 * Responsibility:
 * - Verify profile exists
 * - Delete profile and all associated data
 * - Clear local storage
 */
export class DeleteProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Execute the use case
   * @param input - The profile ID to delete
   * @returns DeleteProfileResultDTO with success status
   */
  async execute(input: DeleteProfileInputDTO): Promise<DeleteProfileResultDTO> {
    try {
      // Step 1: Verify profile exists
      const existingProfile = await this.profileRepository.findById(input.profileId);
      if (!existingProfile) {
        throw new NotFoundError('Profile', input.profileId);
      }

      // Step 2: Delete profile
      const deleted = await this.profileRepository.delete(input.profileId);
      
      if (!deleted) {
        throw new PersistenceError('delete', 'Failed to delete profile');
      }

      // Step 3: Return success
      return {
        success: true
      };
    } catch (error) {
      // Handle known errors
      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: error.message
        };
      }

      if (error instanceof PersistenceError) {
        return {
          success: false,
          error: error.message
        };
      }

      // Handle Error instances
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Unknown error
      return {
        success: false,
        error: 'An unexpected error occurred while deleting profile'
      };
    }
  }
}