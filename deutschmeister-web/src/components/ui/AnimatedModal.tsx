'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { backdropFade, scaleIn } from '@/lib/motion-presets';
import { THEME_VAR, RADIUS, SHADOW } from '@/lib/tokens';

export type AnimatedModalSize = 'sm' | 'md' | 'lg';

export interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: AnimatedModalSize;
  dismissOnBackdrop?: boolean;
  ariaLabel?: string;
}

const SIZE_MAX_WIDTH: Record<AnimatedModalSize, number> = {
  sm: 360,
  md: 520,
  lg: 760,
};

export function AnimatedModal({
  open,
  onClose,
  children,
  size = 'md',
  dismissOnBackdrop = true,
  ariaLabel,
}: AnimatedModalProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          variants={reduce ? undefined : backdropFade}
          initial={reduce ? false : 'hidden'}
          animate={reduce ? undefined : 'show'}
          exit={reduce ? undefined : 'exit'}
          onClick={dismissOnBackdrop ? onClose : undefined}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1000,
          }}
        >
          <motion.div
            variants={reduce ? undefined : scaleIn}
            initial={reduce ? false : 'hidden'}
            animate={reduce ? undefined : 'show'}
            exit={reduce ? undefined : 'exit'}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: SIZE_MAX_WIDTH[size],
              background: THEME_VAR.bgCard,
              color: THEME_VAR.textPrimary,
              borderRadius: RADIUS.lg,
              boxShadow: SHADOW.lifted,
              border: `1px solid ${THEME_VAR.border}`,
              overflow: 'hidden',
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
