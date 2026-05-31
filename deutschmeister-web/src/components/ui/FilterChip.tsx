'use client';

/**
 * FilterChip — v2 toggleable filter/segment chip.
 *   on  → accent tint bg + accent border + accent text
 *   off → elevated bg + soft border + dim text
 * Follows the page's --accent (set per-route on the shell).
 */
interface FilterChipProps {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function FilterChip({ active, onClick, children, className = '', size = 'md' }: FilterChipProps) {
  const pad = size === 'sm' ? '6px 10px' : '7px 12px';
  const fontSize = size === 'sm' ? 11.5 : 12.5;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[7px] font-medium whitespace-nowrap transition-colors ${className}`}
      style={{
        padding: pad,
        fontSize,
        background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--theme-bg-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--theme-border)'}`,
        color: active ? 'var(--accent)' : 'var(--theme-text-muted)',
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
