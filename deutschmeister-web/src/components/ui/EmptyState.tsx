'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-theme-text mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-theme-muted mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-status-info text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-status-info text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {action.label}
          </button>
        )
      )}
      {children}
    </div>
  );
}

// Welcome state for new users
export function WelcomeState() {
  return (
    <div className="p-8 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 text-white text-center">
      <div className="text-6xl mb-4">🇩🇪</div>
      <h2 className="text-2xl font-bold mb-2">
        Chào mừng đến với Deutschmeister!
      </h2>
      <p className="text-white/80 mb-6 max-w-md mx-auto">
        Học từ vựng tiếng Đức với phương pháp Der/Die/Das hiệu quả.
        Bắt đầu hành trình học tiếng Đức của bạn ngay hôm nay!
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/topics"
          className="px-5 py-2.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-white/90 transition-colors"
        >
          📚 Bắt đầu học chủ đề
        </Link>
        <Link
          href="/games/quick-quiz"
          className="px-5 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
        >
          🎮 Chơi Quick Quiz
        </Link>
      </div>
    </div>
  );
}