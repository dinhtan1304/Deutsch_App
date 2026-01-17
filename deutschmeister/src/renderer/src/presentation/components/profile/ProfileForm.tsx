/**
 * Profile Form Component
 * Form for creating/editing user profile
 */

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

/**
 * Form validation schema
 */
const profileFormSchema = z.object({
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

export type ProfileFormData = z.infer<typeof profileFormSchema>;

export interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
  defaultValues?: Partial<ProfileFormData>;
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

export function ProfileForm({
  onSubmit,
  isLoading = false,
  submitText = 'Create Profile',
  defaultValues
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      currentLevel: 'A1',
      targetLevel: 'B1',
      dailyGoalMinutes: 30,
      interfaceLanguage: 'en',
      avatarPath: null,
      ...defaultValues
    }
  });

  const currentLevel = watch('currentLevel');

  // Filter target level options based on current level
  const targetLevelOptions: SelectOption[] = CEFR_LEVELS
    .filter((level) => isValidTargetLevel(currentLevel, level))
    .map((level) => ({
      value: level,
      label: `${level} - ${CEFRLevelInfo[level].name}`
    }));

  const handleFormSubmit = async (data: ProfileFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex justify-center">
        <Controller
          name="avatarPath"
          control={control}
          render={({ field }) => (
            <AvatarPicker
              value={field.value || null}
              onChange={field.onChange}
              size="lg"
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

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={isLoading}
      >
        {submitText}
      </Button>
    </form>
  );
}