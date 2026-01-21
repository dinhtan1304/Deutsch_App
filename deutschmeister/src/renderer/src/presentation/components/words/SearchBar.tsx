/**
 * Search Bar Component
 * Search input for finding German words
 */

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../../shared/utils/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search for a German word...',
  isLoading = false,
  autoFocus = false,
  debounceMs = 300
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
        onSearch(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, onSearch, value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onSearch('');
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(localValue);
      onSearch(localValue);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [localValue, onChange, onSearch, handleClear]);

  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        {isLoading ? (
          <svg
            className="h-5 w-5 animate-spin text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
      </div>

      {/* Input */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-12 pr-10',
          'text-lg text-gray-900 placeholder-gray-400',
          'transition-colors duration-200',
          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
          'hover:border-gray-300'
        )}
      />

      {/* Clear Button */}
      {localValue && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}