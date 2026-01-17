/**
 * Avatar Picker Component
 * Allows user to select or upload an avatar image
 */

import React, { useState, useRef } from 'react';
import { cn } from '../../../shared/utils/cn';
import { Profile } from '../../../domain/entities/Profile';

// Default avatars (can be expanded)
const DEFAULT_AVATARS = [
  '👤', '🧑‍🎓', '👨‍💻', '👩‍💻', '🧑‍🏫', '👨‍🎓', '👩‍🎓', 
  '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸'
];

export interface AvatarPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-16 w-16 text-2xl',
  md: 'h-24 w-24 text-4xl',
  lg: 'h-32 w-32 text-5xl'
};

export function AvatarPicker({ value, onChange, error, size = 'md' }: AvatarPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = Profile.validateAvatarFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChange(base64);
        setShowPicker(false);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read file:', err);
      setIsUploading(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setShowPicker(false);
  };

  const handleRemove = () => {
    onChange(null);
    setShowPicker(false);
  };

  // Check if value is base64 image or emoji
  const isBase64Image = value?.startsWith('data:image');

  return (
    <div className="relative">
      {/* Avatar Display */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          'flex items-center justify-center rounded-full border-2 border-dashed transition-colors',
          'hover:border-blue-500 hover:bg-blue-50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          error ? 'border-red-500' : 'border-gray-300',
          sizeMap[size]
        )}
        aria-label="Change avatar"
      >
        {value ? (
          isBase64Image ? (
            <img
              src={value}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{value}</span>
          )
        ) : (
          <span className="text-gray-400">👤</span>
        )}
      </button>

      {/* Click to change text */}
      <p className="mt-2 text-center text-xs text-gray-500">
        Click to change
      </p>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-center text-sm text-red-500">{error}</p>
      )}

      {/* Picker Modal */}
      {showPicker && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />

          {/* Picker */}
          <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 transform">
            <div className="rounded-lg bg-white p-4 shadow-xl ring-1 ring-black ring-opacity-5">
              <p className="mb-3 text-sm font-medium text-gray-700">
                Choose an avatar
              </p>

              {/* Emoji Grid */}
              <div className="mb-4 grid grid-cols-7 gap-2">
                {DEFAULT_AVATARS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors',
                      'hover:bg-gray-100',
                      value === emoji && 'bg-blue-100 ring-2 ring-blue-500'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-3 border-t border-gray-200" />

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {isUploading ? (
                  'Uploading...'
                ) : (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Upload Image
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Remove Button */}
              {value && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="mt-2 flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Remove Avatar
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}