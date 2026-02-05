'use client';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton rounded-lg ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
        <div key={i} className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <LoadingSkeleton className="w-12 h-12 mb-3" />
          <LoadingSkeleton className="w-16 h-8 mb-2" />
          <LoadingSkeleton className="w-24 h-4" />
        </div>
      ))}
    </div>
  );
}