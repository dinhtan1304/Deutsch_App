/**
 * Setting Toggle Component
 * Reusable toggle switch for boolean settings
 */

import React from 'react';
import { cn } from '../../../shared/utils/cn';

export interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false
}: SettingToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg p-4',
        'bg-gray-50 hover:bg-gray-100 transition-colors',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      
      <button
        type="button"
        role="switch"
        aria-checked={checked ? 'true' : 'false'}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          checked ? 'bg-blue-600' : 'bg-gray-300',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}