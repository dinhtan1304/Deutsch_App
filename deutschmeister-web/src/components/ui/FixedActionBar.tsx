'use client';

import { ReactNode } from 'react';

interface FixedActionBarProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Sticky bottom action bar for result/detail pages.
 * Respects iOS safe-area-inset-bottom.
 */
export function FixedActionBar({ children, columns = 3, className }: FixedActionBarProps) {
  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <>
      {/* spacer so scroll content is not hidden behind the bar */}
      <div aria-hidden="true" style={{ height: 'calc(72px + env(safe-area-inset-bottom))' }} />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg ${className ?? ''}`}
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div className={`max-w-5xl mx-auto px-4 py-3 grid ${gridCols} gap-2`}>
          {children}
        </div>
      </div>
    </>
  );
}
