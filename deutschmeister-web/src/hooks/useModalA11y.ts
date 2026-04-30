'use client';

import { useEffect, useRef } from 'react';

/**
 * Modal accessibility helper:
 * - ESC closes the modal
 * - Focus traps inside the modal (Tab / Shift+Tab cycle)
 * - Focus restored to the previously-focused element on close
 *
 * Usage:
 *   const ref = useModalA11y(open, onClose);
 *   <div ref={ref} role="dialog" aria-modal="true">...</div>
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Save the element that had focus before the modal opened
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    if (!node) return;

    // Focus the first focusable element inside the modal (or the modal itself)
    const focusables = node.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables[0];
    if (first) {
      first.focus();
    } else {
      node.setAttribute('tabindex', '-1');
      node.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      // Re-query focusables each Tab — DOM may have changed
      const list = node.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (list.length === 0) return;

      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === firstEl && lastEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl && firstEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to whoever had it before
      const prev = previousActiveElementRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [open, onClose]);

  return ref;
}
