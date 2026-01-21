/**
 * Setting Slider Component
 * Reusable range slider for numeric settings (e.g., volume)
 */

import React from 'react';
import { cn } from '../../../shared/utils/cn';

export interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
}

export function SettingSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  showValue = true
}: SettingSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {showValue && (
          <span className="text-sm font-semibold text-blue-600">
            {value}{unit}
          </span>
        )}
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          aria-label={label}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-gray-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Custom styling for the thumb
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-blue-600',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            // Firefox
            '[&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-blue-600',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:cursor-pointer'
          )}
          style={{
            background: `linear-gradient(to right, #2563eb ${percentage}%, #e5e7eb ${percentage}%)`
          } as React.CSSProperties}
        />
        
        {/* Min/Max labels */}
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}