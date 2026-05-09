'use client';

import { ReactNode } from 'react';

interface FixedActionBarProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Sticky bottom action bar for result/detail pages.
 * Respects iOS safe-area-inset-bottom and lifts above the mobile BottomTabBar (64px).
 */
export function FixedActionBar({ children, columns = 3, className }: FixedActionBarProps) {
  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <>
      {/* Spacer — extra 64px on mobile to clear BottomTabBar */}
      <div
        aria-hidden="true"
        className="h-[calc(144px+env(safe-area-inset-bottom))] md:h-[calc(80px+env(safe-area-inset-bottom))]"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none pb-[calc(1.5rem+64px+env(safe-area-inset-bottom))] md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div
          className={`w-full max-w-2xl rounded-3xl border shadow-2xl pointer-events-auto backdrop-blur-xl ${className ?? ''}`}
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          <div className={`px-4 py-3.5 grid ${gridCols} gap-2.5`}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
