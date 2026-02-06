'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', style, children, ...props }, ref) => {
    const variantStyles: Record<string, React.CSSProperties> = {
      default: { backgroundColor: 'var(--theme-bg-card)' },
      bordered: { backgroundColor: 'var(--theme-bg-card)', border: '2px solid var(--theme-border)' },
      elevated: { backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 4px 16px rgba(0,0,0,.08)' },
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl p-6', className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4', className)} {...props} />
);

export const CardTitle = ({ className, style, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('text-xl font-bold', className)}
    style={{ color: 'var(--theme-text-primary)', ...style }}
    {...props}
  />
);

export const CardDescription = ({ className, style, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('mt-1', className)}
    style={{ color: 'var(--theme-text-muted)', ...style }}
    {...props}
  />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-4 flex items-center gap-2', className)} {...props} />
);