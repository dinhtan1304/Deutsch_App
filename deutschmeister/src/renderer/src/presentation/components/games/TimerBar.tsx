/**
 * TimerBar Component
 * Visual countdown timer for timed games
 */

import React, { useEffect, useRef } from 'react';

interface TimerBarProps {
  timeRemaining: number;
  maxTime: number;
  isRunning: boolean;
  onTimeout?: () => void;
  showSeconds?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TimerBar({
  timeRemaining,
  maxTime,
  isRunning,
  onTimeout,
  showSeconds = true,
  size = 'md',
  className = ''
}: TimerBarProps) {
  const hasCalledTimeout = useRef(false);
  
  // Calculate percentage
  const percentage = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));
  
  // Determine color based on remaining time
  const getColor = () => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  // Handle timeout
  useEffect(() => {
    if (timeRemaining <= 0 && isRunning && !hasCalledTimeout.current) {
      hasCalledTimeout.current = true;
      onTimeout?.();
    }
    
    // Reset when new question starts
    if (timeRemaining > 0) {
      hasCalledTimeout.current = false;
    }
  }, [timeRemaining, isRunning, onTimeout]);
  
  // Animation class for low time
  const isLowTime = percentage < 30;
  
  return (
    <div className={`w-full ${className}`}>
      {/* Timer bar container */}
      <div className={`
        w-full ${sizeClasses[size]} 
        bg-gray-200 dark:bg-gray-700 
        rounded-full overflow-hidden
        ${isLowTime ? 'animate-pulse' : ''}
      `}>
        {/* Timer bar fill */}
        <div
          className={`
            ${sizeClasses[size]} ${getColor()}
            rounded-full
            transition-all duration-100 ease-linear
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Time remaining text */}
      {showSeconds && (
        <div className="flex justify-between items-center mt-1">
          <span className={`
            text-sm font-mono
            ${isLowTime ? 'text-red-600 dark:text-red-400 font-bold animate-pulse' : 'text-gray-600 dark:text-gray-400'}
          `}>
            {timeRemaining.toFixed(1)}s
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            / {maxTime}s
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * CircularTimer - Alternative circular countdown timer
 */
interface CircularTimerProps {
  timeRemaining: number;
  maxTime: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularTimer({
  timeRemaining,
  maxTime,
  size = 60,
  strokeWidth = 4,
  className = ''
}: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));
  const offset = circumference - (percentage / 100) * circumference;
  
  // Determine color based on remaining time
  const getStrokeColor = () => {
    if (percentage > 60) return '#22c55e'; // green-500
    if (percentage > 30) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };
  
  const isLowTime = percentage < 30;
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${isLowTime ? 'animate-pulse' : ''}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-gray-200 dark:stroke-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none transition-all duration-100 ease-linear"
          style={{
            stroke: getStrokeColor(),
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            strokeLinecap: 'round'
          }}
        />
      </svg>
      {/* Center text */}
      <span className={`
        absolute text-lg font-bold font-mono
        ${isLowTime ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
      `}>
        {Math.ceil(timeRemaining)}
      </span>
    </div>
  );
}
