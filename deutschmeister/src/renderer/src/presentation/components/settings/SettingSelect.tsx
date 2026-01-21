/**
 * Setting Select Component
 * Reusable dropdown select for settings with options
 */

import React from 'react';
import { cn } from '../../../shared/utils/cn';

export interface SettingSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  options: SettingSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SettingSelect({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false
}: SettingSelectProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{label}</p>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
        </div>
        
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-label={label}
            className={cn(
              'appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm font-medium',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}