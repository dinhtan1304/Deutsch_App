/**
 * Edit Profile Modal Component
 * Modal dialog for editing user profile
 */

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import { AvatarPicker } from './AvatarPicker';
import { CEFR_LEVELS, CEFRLevelInfo, isValidTargetLevel } from '../../../domain/valueObjects/CEFRLevel';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../../../domain/valueObjects/Language';
import { ProfileValidation } from '../../../domain/entities/Profile';
import { useProfileStore, useProfile, useIsLoading, useProfileError } from '../../stores/profileStore';
import { cn } from '../../../shared/utils/cn';

/**
 * Form validation schema
 */
const editProfileFormSchema = z.object({
  displayName: z
    .string()
    .min(ProfileValidation.displayName.minLength, 
      `Name must be at least ${ProfileValidation.displayName.minLength} characters`)
    .max(ProfileValidation.displayName.maxLength, 
      `Name must not exceed ${ProfileValidation.displayName.maxLength} characters`)
    .regex(ProfileValidation.displayName.pattern, 
      'Name can only contain letters, numbers, and spaces'),
  currentLevel: z.enum(CEFR_LEVELS),
  targetLevel: z.enum(CEFR_LEVELS),
  dailyGoalMinutes: z
    .number()
    .min(ProfileValidation.dailyGoalMinutes.min, 
      `Minimum ${ProfileValidation.dailyGoalMinutes.min} minutes`)
    .max(ProfileValidation.dailyGoalMinutes.max, 
      `Maximum ${ProfileValidation.dailyGoalMinutes.max} minutes`),
  interfaceLanguage: z.enum(SUPPORTED_LANGUAGES),
  avatarPath: z.string().nullable().optional()
}).refine(
  (data) => isValidTargetLevel(data.currentLevel, data.targetLevel),
  {
    message: 'Target level must be equal to or higher than current level',
    path: ['targetLevel']
  }
);

type EditProfileFormData = z.infer<typeof editProfileFormSchema>;

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Daily goal preset options
const DAILY_GOAL_OPTIONS: SelectOption[] = [
  { value: '5', label: '5 minutes - Quick review' },
  { value: '15', label: '15 minutes - Light study' },
  { value: '30', label: '30 minutes - Regular study' },
  { value: '45', label: '45 minutes - Dedicated learning' },
  { value: '60', label: '60 minutes - Intensive study' },
  { value: '90', label: '90 minutes - Deep immersion' },
  { value: '120', label: '120 minutes - Full session' }
];

// CEFR level options
const LEVEL_OPTIONS: SelectOption[] = CEFR_LEVELS.map((level) => ({
  value: level,
  label: `${level} - ${CEFRLevelInfo[level].name}`
}));

// Language options
const LANGUAGE_OPTIONS: SelectOption[] = SUPPORTED_LANGUAGES.map((lang) => ({
  value: lang,
  label: `${LanguageInfo[lang].flag} ${LanguageInfo[lang].name}`
}));

export function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const profile = useProfile();
  const isLoading = useIsLoading();
  const error = useProfileError();
  const { updateProfileAsync, setError } = useProfileStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileFormSchema),
    defaultValues: {
      displayName: profile?.displayName || '',
      currentLevel: profile?.currentLevel || 'A1',
      targetLevel: profile?.targetLevel || 'B1',
      dailyGoalMinutes: profile?.dailyGoalMinutes || 30,
      interfaceLanguage: profile?.interfaceLanguage || 'en',
      avatarPath: profile?.avatarPath || null
    }
  });

  // Reset form when profile changes or modal opens
  useEffect(() => {
    if (isOpen && profile) {
      reset({
        displayName: profile.displayName,
        currentLevel: profile.currentLevel,
        targetLevel: profile.targetLevel,
        dailyGoalMinutes: profile.dailyGoalMinutes,
        interfaceLanguage: profile.interfaceLanguage,
        avatarPath: profile.avatarPath
      });
      setError(null);
    }
  }, [isOpen, profile, reset, setError]);

  const currentLevel = watch('currentLevel');

  // Filter target level options based on current level
  const targetLevelOptions: SelectOption[] = CEFR_LEVELS
    .filter((level) => isValidTargetLevel(currentLevel, level))
    .map((level) => ({
      value: level,
      label: `${level} - ${CEFRLevelInfo[level].name}`
    }));

  const handleFormSubmit = async (data: EditProfileFormData) => {
    const success = await updateProfileAsync({
      displayName: data.displayName,
      avatarPath: data.avatarPath,
      currentLevel: data.currentLevel,
      targetLevel: data.targetLevel,
      dailyGoalMinutes: data.dailyGoalMinutes,
      interfaceLanguage: data.interfaceLanguage
    });

    if (success) {
      onSuccess?.();
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl bg-white shadow-2xl',
          'animate-scale-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="edit-profile-title" className="text-xl font-semibold text-gray-900">
            Edit Profile
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            {/* Avatar */}
            <div className="flex justify-center">
              <Controller
                name="avatarPath"
                control={control}
                render={({ field }) => (
                  <AvatarPicker
                    value={field.value || null}
                    onChange={field.onChange}
                    size="md"
                  />
                )}
              />
            </div>

            {/* Display Name */}
            <Input
              label="Display Name"
              placeholder="Enter your name"
              error={errors.displayName?.message}
              {...register('displayName')}
              required
            />

            {/* Current & Target Level */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="currentLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Current Level"
                    options={LEVEL_OPTIONS}
                    error={errors.currentLevel?.message}
                    required
                    {...field}
                  />
                )}
              />

              <Controller
                name="targetLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Target Level"
                    options={targetLevelOptions}
                    error={errors.targetLevel?.message}
                    required
                    {...field}
                  />
                )}
              />
            </div>

            {/* Daily Study Goal */}
            <Controller
              name="dailyGoalMinutes"
              control={control}
              render={({ field }) => (
                <Select
                  label="Daily Study Goal"
                  options={DAILY_GOAL_OPTIONS}
                  error={errors.dailyGoalMinutes?.message}
                  required
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />

            {/* Interface Language */}
            <Controller
              name="interfaceLanguage"
              control={control}
              render={({ field }) => (
                <Select
                  label="Interface Language"
                  options={LANGUAGE_OPTIONS}
                  error={errors.interfaceLanguage?.message}
                  required
                  {...field}
                />
              )}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            isLoading={isLoading}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}