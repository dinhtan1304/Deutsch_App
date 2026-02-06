'use client';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-full animate-spin`}
        style={{ borderColor: 'var(--theme-border)', borderTopColor: '#3B82F6' }}
      />
      {text && (
        <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50"
        style={{ backgroundColor: 'rgba(var(--theme-bg-primary-rgb, 255,255,255), 0.8)' }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
      <LoadingSkeleton className="w-12 h-12 mb-4" />
      <LoadingSkeleton className="w-3/4 h-6 mb-2" />
      <LoadingSkeleton className="w-1/2 h-4 mb-4" />
      <LoadingSkeleton className="w-full h-2" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl border"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <LoadingSkeleton className="w-12 h-12 mb-3" />
          <LoadingSkeleton className="w-16 h-8 mb-2" />
          <LoadingSkeleton className="w-24 h-4" />
        </div>
      ))}
    </div>
  );
}