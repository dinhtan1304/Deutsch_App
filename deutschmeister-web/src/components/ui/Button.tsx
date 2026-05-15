'use client';
/* eslint-disable no-restricted-syntax */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'game';

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragExit'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDrop'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
>;

export interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  accent?: AccentKey;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function gameVariantStyle(accent: AccentKey): React.CSSProperties {
  const key = (accent in GRADIENT ? accent : 'brand') as keyof typeof GRADIENT;
  return {
    background: GRADIENT[key],
    color: '#fff',
    boxShadow: `0 4px 12px ${ACCENT[accent]}30`,
  };
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', accent, isLoading, disabled, fullWidth, leftIcon, rightIcon, children, style, ...props }, ref) => {
    const reduce = useReducedMotion();
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: { background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,.25)' },
      secondary: { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' },
      outline: { backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', border: '2px solid var(--theme-border)' },
      ghost: { backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' },
      danger: { background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,.25)' },
      game: accent ? gameVariantStyle(accent) : gameVariantStyle('brand'),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-body',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-[15px]',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, sizes[size], 'hover:-translate-y-0.5', fullWidth && 'w-full', className)}
        style={{ ...variantStyles[variant], ...style }}
        disabled={disabled || isLoading}
        whileTap={reduce || disabled || isLoading ? undefined : { scale: 0.97 }}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" style={{ display: 'block' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
