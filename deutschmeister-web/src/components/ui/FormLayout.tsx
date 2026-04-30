'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TrustPoint {
  icon: ReactNode;
  text: string;
}

export type FormLayoutVariant = 'app' | 'marketing';

export interface FormLayoutProps {
  title: string;
  subtitle?: string;
  trustPoints?: TrustPoint[];
  brandSlot?: ReactNode;       // logo or brand element in the brand column
  children: ReactNode;         // form fields + buttons
  footer?: ReactNode;          // e.g. "Đã có tài khoản? Đăng nhập"
  variant?: FormLayoutVariant; // 'app' = theme-aware; 'marketing' = dark navy + orbs
  className?: string;
}

/**
 * Auth page layout — 60/40 split with form given priority.
 *
 * Two variants:
 *  - 'app' (default): theme-aware surfaces, used for in-app forms.
 *  - 'marketing': forced dark navy background + floating orb gradients + grid pattern,
 *    mirrors the landing page aesthetic. Used for login/register entry points.
 *
 * On mobile the brand column collapses above the form.
 */
export function FormLayout({
  title,
  subtitle,
  trustPoints,
  brandSlot,
  children,
  footer,
  variant = 'app',
  className,
}: FormLayoutProps) {
  const hasBrandColumn = Boolean(brandSlot || trustPoints?.length);
  const isMarketing = variant === 'marketing';

  if (isMarketing) {
    return (
      <div
        className={cn('relative min-h-screen w-full overflow-hidden', className)}
        style={{ backgroundColor: 'var(--marketing-bg)' }}
      >
        {/* Floating orbs + grid — pure decoration */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <div
            className="absolute"
            style={{
              top: '-15%', right: '-5%', width: 600, height: 600, borderRadius: '50%',
              background: 'var(--marketing-orb-1)',
              animation: 'marketingFloat1 9s ease-in-out infinite',
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: '-20%', left: '-8%', width: 500, height: 500, borderRadius: '50%',
              background: 'var(--marketing-orb-2)',
              animation: 'marketingFloat2 11s ease-in-out infinite',
            }}
          />
          <div
            className="absolute"
            style={{
              top: '50%', left: '40%', width: 350, height: 350, borderRadius: '50%',
              background: 'var(--marketing-orb-3)',
              animation: 'marketingFloat3 13s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'var(--marketing-grid)',
              backgroundSize: '60px 60px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
          {/* Form column — 60% on desktop, full on mobile */}
          <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-3/5 lg:p-12">
            <div
              className="w-full max-w-md"
              style={{ animation: 'marketingFadeUp 0.5s ease-out' }}
            >
              <h1
                className="text-h1 font-bold"
                style={{ color: 'var(--marketing-text)' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-body" style={{ color: 'var(--marketing-muted)' }}>
                  {subtitle}
                </p>
              )}
              <div className="mt-8 flex flex-col gap-4">{children}</div>
              {footer && (
                <div className="mt-6 text-body" style={{ color: 'var(--marketing-muted)' }}>
                  {footer}
                </div>
              )}
            </div>
          </div>

          {/* Brand column — 40% on desktop, compact above form on mobile */}
          {hasBrandColumn && (
            <aside
              className="order-first w-full border-b lg:order-last lg:w-2/5 lg:border-b-0 lg:border-l"
              style={{ borderColor: 'var(--marketing-border)' }}
            >
              <div className="flex h-full flex-col justify-center gap-6 p-6 lg:p-12">
                {brandSlot && <div>{brandSlot}</div>}
                {trustPoints && trustPoints.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {trustPoints.map((tp, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-body"
                        style={{
                          color: 'var(--marketing-muted)',
                          animation: `marketingFadeLeft 0.5s ${0.1 + i * 0.1}s ease-out both`,
                        }}
                      >
                        <span className="mt-0.5 shrink-0" aria-hidden>{tp.icon}</span>
                        <span>{tp.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    );
  }

  // App variant — theme-aware (default)
  return (
    <div
      className={cn('min-h-screen w-full', className)}
      style={{ backgroundColor: 'var(--theme-bg-body)' }}
    >
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        <div className="flex w-full flex-1 items-center justify-center p-6 md:w-3/5 md:p-12">
          <div className="w-full max-w-md">
            <h1
              className="text-h1 font-bold"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-2 text-body"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                {subtitle}
              </p>
            )}
            <div className="mt-8 flex flex-col gap-4">{children}</div>
            {footer && (
              <div
                className="mt-6 text-body"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                {footer}
              </div>
            )}
          </div>
        </div>

        {hasBrandColumn && (
          <aside
            className="order-first w-full border-b md:order-last md:w-2/5 md:border-b-0 md:border-l"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-secondary)',
            }}
          >
            <div className="flex h-full flex-col justify-center gap-6 p-6 md:p-12">
              {brandSlot && <div>{brandSlot}</div>}
              {trustPoints && trustPoints.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {trustPoints.map((tp, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-body"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      <span className="mt-0.5 shrink-0" aria-hidden>{tp.icon}</span>
                      <span>{tp.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
