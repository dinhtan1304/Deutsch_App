'use client';

import type { ReactNode, CSSProperties } from 'react';

/**
 * Shared building blocks for the mobile card-list layout used across admin
 * pages. On phones each table row becomes an `AdminCard`; on desktop the
 * original `<table>` is kept. Inline-styled with `var(--theme-*)` to match the
 * existing admin aesthetic.
 */

export function AdminCard({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function AdminCardList({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>;
}

/** Label–value pair shown inside a card. */
export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: 'var(--theme-text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--theme-text-secondary)', textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );
}
