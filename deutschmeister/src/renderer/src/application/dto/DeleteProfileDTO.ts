/**
 * Delete Profile DTO
 * Data Transfer Object for deleting a profile
 */

/**
 * Input DTO for deleting a profile
 */
export interface DeleteProfileInputDTO {
  profileId: string;
  confirmationText?: string; // Optional: require user to type something to confirm
}

/**
 * Result wrapper for delete profile operation
 */
export interface DeleteProfileResultDTO {
  success: boolean;
  error?: string;
}