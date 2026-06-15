'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` when the viewport is at or below `maxWidth` (default 768px).
 *
 * SSR-safe: defaults to `false` (desktop) on the server and during the first
 * client render, then updates after mount via `matchMedia`. Used by the admin
 * area to switch tables ↔ card lists and sidebar ↔ drawer.
 */
export function useIsMobile(maxWidth = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [maxWidth]);

  return isMobile;
}
