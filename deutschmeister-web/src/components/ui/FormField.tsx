'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT } from '@/lib/tokens';

export type FormFieldVariant = 'app' | 'marketing';

export interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  variant?: FormFieldVariant;
}

/**
 * Form field — label + icon-adorned input + focus ring + error/hint display.
 *
 * Two variants (match FormLayout):
 *  - 'app' (default): theme-aware surfaces for in-app forms.
 *  - 'marketing': dark translucent input with indigo focus ring, for auth entry.
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, icon, error, hint, className, onFocus, onBlur, type = 'text', variant = 'app', ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const isMarketing = variant === 'marketing';

    const labelColor = isMarketing ? 'var(--marketing-muted)' : 'var(--theme-text-secondary)';
    const iconColor = isMarketing ? 'var(--marketing-dim)' : 'var(--theme-text-muted)';
    const inputBg = isMarketing
      ? focused && !error ? 'var(--marketing-input-bg-focus)' : 'var(--marketing-input-bg)'
      : 'var(--theme-bg-secondary)';
    const inputBorder = error
      ? 'var(--color-status-danger, #EF4444)'
      : isMarketing
        ? focused ? 'var(--marketing-input-border-focus)' : 'var(--marketing-input-border)'
        : focused ? ACCENT.brand : 'var(--theme-border)';
    const inputColor = isMarketing ? 'var(--marketing-text)' : 'var(--theme-text-primary)';
    const ringShadow = focused && !error
      ? isMarketing
        ? '0 0 0 3px var(--marketing-input-ring)'
        : `0 0 0 3px ${ACCENT.brand}26`
      : 'none';

    return (
      <div className="w-full">
        {label && (
          <label
            className="mb-1.5 block text-body font-semibold"
            style={{ color: labelColor }}
            htmlFor={props.id ?? props.name}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: iconColor }}
              aria-hidden
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={props.id ?? props.name}
            type={type}
            className={cn(
              'w-full rounded-md border text-body transition-all duration-150 focus:outline-none',
              icon ? 'pl-11 pr-4 py-3' : 'px-4 py-3',
              className,
            )}
            style={{
              backgroundColor: inputBg,
              borderColor: inputBorder,
              color: inputColor,
              boxShadow: ringShadow,
            }}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-caption" style={{ color: 'var(--color-status-danger, #EF4444)' }}>
            {error}
          </p>
        )}
        {!error && hint && (
          <p
            className="mt-1.5 text-caption"
            style={{ color: isMarketing ? 'var(--marketing-dim)' : 'var(--theme-text-muted)' }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
