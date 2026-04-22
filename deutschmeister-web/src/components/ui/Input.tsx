'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-body font-semibold mb-1.5"
            style={{ color: 'var(--theme-text-secondary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            className
          )}
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: error ? '#EF4444' : 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
            ...style,
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';