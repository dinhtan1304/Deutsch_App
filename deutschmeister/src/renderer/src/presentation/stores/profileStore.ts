/**
 * Profile Store
 * Zustand store for managing profile state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CEFRLevel } from '../../domain/valueObjects/CEFRLevel';
import { Language } from '../../domain/valueObjects/Language';
import { CreateProfileOutputDTO } from '../../application/dto/CreateProfileDTO';
import { UpdateProfileInputDTO, UpdateProfileOutputDTO } from '../../application/dto/UpdateProfileDTO';
import { UpdateProfileUseCase } from '../../application/usecases/UpdateProfileUseCase';
import { DeleteProfileUseCase } from '../../application/usecases/DeleteProfileUseCase';
import { ProfileRepository } from '../../infrastructure/repositories/ProfileRepository';

/**
 * Profile state interface
 */
interface ProfileState {
  // Profile data
  profile: CreateProfileOutputDTO | null;
  isLoading: boolean;
  error: string | null;
  
  // Onboarding state
  hasCompletedOnboarding: boolean;
  
  // Edit mode state
  isEditing: boolean;
  
  // Actions
  setProfile: (profile: CreateProfileOutputDTO) => void;
  updateProfile: (updates: Partial<CreateProfileOutputDTO>) => void;
  updateProfileAsync: (updates: UpdateProfileInputDTO) => Promise<boolean>;
  deleteProfileAsync: () => Promise<boolean>;
  clearProfile: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setEditing: (isEditing: boolean) => void;
}

/**
 * Profile Zustand Store
 * Persisted to localStorage
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      isLoading: false,
      error: null,
      hasCompletedOnboarding: false,
      isEditing: false,
      
      // Actions
      setProfile: (profile) => {
        set({ 
          profile, 
          error: null,
          hasCompletedOnboarding: true 
        });
      },
      
      updateProfile: (updates) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          });
        }
      },

      /**
       * Update profile asynchronously using UpdateProfileUseCase
       * Returns true if successful, false otherwise
       */
      updateProfileAsync: async (updates: UpdateProfileInputDTO): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const profileRepository = new ProfileRepository();
          const updateProfileUseCase = new UpdateProfileUseCase(profileRepository);
          
          const result = await updateProfileUseCase.execute(updates);
          
          if (result.success && result.data) {
            set({ 
              profile: result.data,
              isLoading: false,
              isEditing: false,
              error: null
            });
            return true;
          } else {
            const errorMessage = result.errors
              ?.map((e) => e.message)
              .join(', ') || 'Failed to update profile';
            set({ 
              isLoading: false, 
              error: errorMessage 
            });
            return false;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An unexpected error occurred';
          set({ 
            isLoading: false, 
            error: message 
          });
          return false;
        }
      },

      /**
       * Delete profile asynchronously using DeleteProfileUseCase
       * Returns true if successful, false otherwise
       */
      deleteProfileAsync: async (): Promise<boolean> => {
        const currentProfile = get().profile;
        if (!currentProfile) {
          set({ error: 'No profile to delete' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const profileRepository = new ProfileRepository();
          const deleteProfileUseCase = new DeleteProfileUseCase(profileRepository);
          
          const result = await deleteProfileUseCase.execute({ 
            profileId: currentProfile.id 
          });
          
          if (result.success) {
            // Clear all profile data
            set({ 
              profile: null,
              isLoading: false,
              hasCompletedOnboarding: false,
              isEditing: false,
              error: null
            });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: result.error || 'Failed to delete profile'
            });
            return false;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An unexpected error occurred';
          set({ 
            isLoading: false, 
            error: message 
          });
          return false;
        }
      },
      
      clearProfile: () => {
        set({ 
          profile: null, 
          hasCompletedOnboarding: false,
          error: null,
          isEditing: false
        });
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      setError: (error) => {
        set({ error, isLoading: false });
      },
      
      setOnboardingComplete: (complete) => {
        set({ hasCompletedOnboarding: complete });
      },

      setEditing: (isEditing) => {
        set({ isEditing, error: null });
      }
    }),
    {
      name: 'deutschmeister-profile-store',
      partialize: (state) => ({
        profile: state.profile,
        hasCompletedOnboarding: state.hasCompletedOnboarding
      })
    }
  )
);

/**
 * Selector hooks for specific profile data
 */
export const useProfile = () => useProfileStore((state) => state.profile);
export const useIsLoading = () => useProfileStore((state) => state.isLoading);
export const useProfileError = () => useProfileStore((state) => state.error);
export const useHasCompletedOnboarding = () => useProfileStore((state) => state.hasCompletedOnboarding);
export const useIsEditing = () => useProfileStore((state) => state.isEditing);

/**
 * Get display name or default
 */
export const useDisplayName = () => {
  const profile = useProfile();
  return profile?.displayName || 'Guest';
};

/**
 * Get current level
 */
export const useCurrentLevel = (): CEFRLevel | null => {
  const profile = useProfile();
  return profile?.currentLevel || null;
};

/**
 * Get interface language
 */
export const useInterfaceLanguage = (): Language => {
  const profile = useProfile();
  return profile?.interfaceLanguage || 'en';
};