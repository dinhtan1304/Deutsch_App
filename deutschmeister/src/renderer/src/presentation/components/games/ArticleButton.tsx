/**
 * ArticleButton Component
 * Button for selecting German articles (der/die/das)
 */

import React from 'react';
import { Gender, GenderInfo } from '../../../domain/valueObjects/Gender';

interface ArticleButtonProps {
  gender: Gender;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  isCorrect?: boolean | null;  // null = not revealed yet
  showFeedback?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ArticleButton({
  gender,
  onClick,
  disabled = false,
  selected = false,
  isCorrect = null,
  showFeedback = false,
  size = 'lg',
  className = ''
}: ArticleButtonProps) {
  const info = GenderInfo[gender];
  
  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-lg min-w-[80px]',
    md: 'px-6 py-3 text-xl min-w-[100px]',
    lg: 'px-8 py-4 text-2xl min-w-[120px]'
  };
  
  // Determine background color based on state
  const getBackgroundClass = () => {
    if (showFeedback && isCorrect !== null) {
      if (selected && isCorrect) {
        return 'bg-green-500 hover:bg-green-500 text-white border-green-600';
      }
      if (selected && !isCorrect) {
        return 'bg-red-500 hover:bg-red-500 text-white border-red-600';
      }
      if (!selected && isCorrect) {
        // Show the correct answer
        return 'bg-green-100 border-green-500 text-green-800';
      }
    }
    
    if (selected) {
      return `${info.bgClass} border-2 ${info.colorClass.replace('text-', 'border-')}`;
    }
    
    // Default state
    return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600';
  };
  
  // Determine text color
  const getTextClass = () => {
    if (showFeedback && selected && isCorrect !== null) {
      return 'text-white';
    }
    if (showFeedback && !selected && isCorrect) {
      return 'text-green-800 dark:text-green-300';
    }
    return info.colorClass;
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || (showFeedback && isCorrect !== null)}
      className={`
        ${sizeClasses[size]}
        ${getBackgroundClass()}
        ${getTextClass()}
        font-bold rounded-xl border-2
        transition-all duration-200
        transform hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        shadow-md hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${className}
      `}
    >
      {info.article}
    </button>
  );
}

/**
 * ArticleButtonGroup - Group of all three article buttons
 */
interface ArticleButtonGroupProps {
  onSelect: (gender: Gender) => void;
  disabled?: boolean;
  selectedGender?: Gender | null;
  correctGender?: Gender | null;
  showFeedback?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ArticleButtonGroup({
  onSelect,
  disabled = false,
  selectedGender = null,
  correctGender = null,
  showFeedback = false,
  size = 'lg',
  className = ''
}: ArticleButtonGroupProps) {
  const genders: Gender[] = ['masculine', 'feminine', 'neuter'];
  
  return (
    <div className={`flex gap-4 justify-center ${className}`}>
      {genders.map(gender => (
        <ArticleButton
          key={gender}
          gender={gender}
          onClick={() => onSelect(gender)}
          disabled={disabled}
          selected={selectedGender === gender}
          isCorrect={correctGender === gender}
          showFeedback={showFeedback}
          size={size}
        />
      ))}
    </div>
  );
}
