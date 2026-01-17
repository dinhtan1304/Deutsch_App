/**
 * Create Profile Page
 * Onboarding page for new users to create their profile
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { ProfileForm, ProfileFormData } from '../../components/profile/ProfileForm';
import { useProfileStore } from '../../stores/profileStore';
import { CreateProfileUseCase } from '../../../application/usecases/CreateProfileUseCase';
import { ProfileRepository } from '../../../infrastructure/repositories/ProfileRepository';
import { CreateProfileInputDTO } from '../../../application/dto/CreateProfileDTO';

export function CreateProfilePage() {
  const navigate = useNavigate();
  const { setProfile, setLoading, setError } = useProfileStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    setLoading(true);

    try {
      // Create repository and use case
      const profileRepository = new ProfileRepository();
      const createProfileUseCase = new CreateProfileUseCase(profileRepository);

      // Prepare input DTO
      const input: CreateProfileInputDTO = {
        displayName: data.displayName,
        currentLevel: data.currentLevel,
        targetLevel: data.targetLevel,
        dailyGoalMinutes: data.dailyGoalMinutes,
        interfaceLanguage: data.interfaceLanguage,
        avatarPath: data.avatarPath || null
      };

      // Execute use case
      const result = await createProfileUseCase.execute(input);

      if (result.success && result.data) {
        // Update store
        setProfile(result.data);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // Handle errors
        const errorMessage = result.errors
          ?.map((e) => e.message)
          .join(', ') || 'Failed to create profile';
        
        setFormError(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setFormError(message);
      setError(message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            🇩🇪 DeutschMeister
          </h1>
          <p className="mt-2 text-gray-600">
            Master German, one step at a time
          </p>
        </div>

        {/* Profile Form Card */}
        <Card shadow="lg">
          <CardHeader>
            <CardTitle>Create Your Profile</CardTitle>
            <CardDescription>
              Let's set up your learning preferences to personalize your experience
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error Alert */}
            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formError}
                </div>
              </div>
            )}

            <ProfileForm
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitText="Get Started"
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          By creating a profile, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}