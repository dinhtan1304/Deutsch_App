'use client';

import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', style, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-body font-semibold mb-1.5"
            style={{ color: 'var(--theme-text-secondary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            className
          )}
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: error ? STATUS.danger : 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
            ...style,
          }}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs" style={{ color: STATUS.danger }}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';