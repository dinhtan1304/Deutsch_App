/**
 * Filter Bar Component
 * Filters for searching words by gender, category, level
 */

import React from 'react';
import { Gender, GENDERS, GenderInfo } from '../../../domain/valueObjects/Gender';
import { WordCategory, WORD_CATEGORIES, WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { CEFRLevel, CEFR_LEVELS, CEFRLevelInfo } from '../../../domain/valueObjects/CEFRLevel';
import { cn } from '../../../shared/utils/cn';

export interface FilterBarProps {
  selectedGender: Gender | null;
  selectedCategory: WordCategory | null;
  selectedLevel: CEFRLevel | null;
  onGenderChange: (gender: Gender | null) => void;
  onCategoryChange: (category: WordCategory | null) => void;
  onLevelChange: (level: CEFRLevel | null) => void;
  onClearAll: () => void;
  onApply: () => void;
}

export function FilterBar({
  selectedGender,
  selectedCategory,
  selectedLevel,
  onGenderChange,
  onCategoryChange,
  onLevelChange,
  onClearAll,
  onApply
}: FilterBarProps) {
  const hasFilters = selectedGender || selectedCategory || selectedLevel;

  return (
    <div className="space-y-4">
      {/* Gender Filter */}
      <div>
        <label className="text-xs font-medium uppercase text-gray-500">Article</label>
        <div className="mt-2 flex gap-2">
          {GENDERS.map(gender => {
            const info = GenderInfo[gender];
            const isSelected = selectedGender === gender;
            
            return (
              <button
                key={gender}
                onClick={() => onGenderChange(isSelected ? null : gender)}
                className={cn(
                  'flex-1 rounded-lg border-2 py-2 px-3 text-center transition-all',
                  isSelected
                    ? `${info.borderClass} ${info.bgClass}`
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className={cn(
                  'text-lg font-bold',
                  isSelected ? info.colorClass : 'text-gray-600'
                )}>
                  {info.article}
                </span>
                <span className={cn(
                  'block text-xs mt-0.5',
                  isSelected ? info.colorClass : 'text-gray-400'
                )}>
                  {info.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label htmlFor="category-filter" className="text-xs font-medium uppercase text-gray-500">Category</label>
        <div className="mt-2 relative">
          <select
            id="category-filter"
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value as WordCategory || null)}
            className={cn(
              'w-full appearance-none rounded-lg border-2 border-gray-200 bg-white py-2 pl-3 pr-10 text-sm',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              selectedCategory ? 'text-gray-900' : 'text-gray-500'
            )}
          >
            <option value="">All categories</option>
            {WORD_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {WordCategoryInfo[category].icon} {WordCategoryInfo[category].name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Level Filter */}
      <div>
        <label className="text-xs font-medium uppercase text-gray-500">Level</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CEFR_LEVELS.slice(0, 4).map(level => {
            const isSelected = selectedLevel === level;
            
            return (
              <button
                key={level}
                onClick={() => onLevelChange(isSelected ? null : level)}
                className={cn(
                  'rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {hasFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
        <button
          onClick={onApply}
          className={cn(
            'ml-auto rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

/**
 * Compact Filter Pills for showing active filters
 */
export interface FilterPillsProps {
  selectedGender: Gender | null;
  selectedCategory: WordCategory | null;
  selectedLevel: CEFRLevel | null;
  onRemoveGender: () => void;
  onRemoveCategory: () => void;
  onRemoveLevel: () => void;
  onClearAll: () => void;
}

export function FilterPills({
  selectedGender,
  selectedCategory,
  selectedLevel,
  onRemoveGender,
  onRemoveCategory,
  onRemoveLevel,
  onClearAll
}: FilterPillsProps) {
  const hasFilters = selectedGender || selectedCategory || selectedLevel;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">Filters:</span>
      
      {selectedGender && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm',
            GenderInfo[selectedGender].bgClass,
            GenderInfo[selectedGender].colorClass
          )}
        >
          {GenderInfo[selectedGender].article}
          <button onClick={onRemoveGender} className="ml-1 hover:opacity-70">×</button>
        </span>
      )}
      
      {selectedCategory && (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-700">
          {WordCategoryInfo[selectedCategory].icon} {WordCategoryInfo[selectedCategory].name}
          <button onClick={onRemoveCategory} className="ml-1 hover:opacity-70">×</button>
        </span>
      )}
      
      {selectedLevel && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-sm text-blue-700">
          {selectedLevel}
          <button onClick={onRemoveLevel} className="ml-1 hover:opacity-70">×</button>
        </span>
      )}
      
      <button
        onClick={onClearAll}
        className="text-xs text-gray-400 hover:text-gray-600 ml-2"
      >
        Clear all
      </button>
    </div>
  );
}