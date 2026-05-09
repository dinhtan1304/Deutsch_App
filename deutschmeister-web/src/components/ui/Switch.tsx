'use client';
/* eslint-disable no-restricted-syntax */

import { ReactNode, useId } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
}

export function Switch({ checked, onChange, label, description, disabled, id }: SwitchProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-3 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <button
        type="button"
        id={inputId}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: checked ? '#6366F1' : 'var(--theme-bg-tertiary)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <span
          aria-hidden
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
      {(label || description) && (
        <span className="flex-1 min-w-0">
          {label && (
            <span className="block text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
