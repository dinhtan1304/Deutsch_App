'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { slideInRight } from '@/lib/motion-presets';
import { THEME_VAR, RADIUS, SHADOW, STATUS } from '@/lib/tokens';

export type ToastKind = 'info' | 'success' | 'warning' | 'danger';

export interface ToastInput {
  title: string;
  description?: string;
  kind?: ToastKind;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastInput, 'title' | 'kind' | 'duration'>> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  show: (input: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_COLOR: Record<ToastKind, string> = {
  info: STATUS.info,
  success: STATUS.success,
  warning: STATUS.warning,
  danger: STATUS.danger,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const reduce = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setItems((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = ++idRef.current;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        kind: input.kind ?? 'info',
        duration: input.duration ?? 3000,
      };
      setItems((curr) => [...curr, item]);
      window.setTimeout(() => dismiss(id), item.duration);
    },
    [dismiss],
  );

  const ctx = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              variants={reduce ? undefined : slideInRight}
              initial={reduce ? false : 'hidden'}
              animate={reduce ? undefined : 'show'}
              exit={reduce ? undefined : 'exit'}
              style={{
                pointerEvents: 'auto',
                minWidth: 260,
                maxWidth: 360,
                background: THEME_VAR.bgCard,
                color: THEME_VAR.textPrimary,
                borderRadius: RADIUS.md,
                boxShadow: SHADOW.lifted,
                border: `1px solid ${THEME_VAR.border}`,
                borderLeft: `4px solid ${KIND_COLOR[t.kind]}`,
                padding: '10px 14px',
                cursor: 'pointer',
              }}
              onClick={() => dismiss(t.id)}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
              {t.description && (
                <div style={{ fontSize: 13, color: THEME_VAR.textSecondary, marginTop: 2 }}>
                  {t.description}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
