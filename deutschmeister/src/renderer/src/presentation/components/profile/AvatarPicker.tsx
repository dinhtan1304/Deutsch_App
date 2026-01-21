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
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowPicker(false)}
          />

          {/* Picker */}
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="w-80 rounded-xl bg-white p-6 shadow-2xl ring-1 ring-black ring-opacity-5">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-semibold text-gray-900">
                  Choose an avatar
                </p>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Emoji Grid - Bigger and better spaced */}
              <div className="mb-5 grid grid-cols-5 gap-3">
                {DEFAULT_AVATARS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all duration-150',
                      'hover:bg-gray-100 hover:scale-110',
                      value === emoji && 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-gray-200" />

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
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
                    Upload Custom Image
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
                  className="mt-3 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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