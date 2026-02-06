'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, style, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: { background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,.25)' },
      secondary: { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' },
      outline: { backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', border: '2px solid var(--theme-border)' },
      ghost: { backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' },
      danger: { background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,.25)' },
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[13px]',
      md: 'px-4 py-2 text-[14px]',
      lg: 'px-6 py-3 text-[15px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizes[size], 'hover:-translate-y-0.5', className)}
        style={{ ...variantStyles[variant], ...style }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" style={{ display: 'block' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';