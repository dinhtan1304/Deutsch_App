'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { STATUS, GRADIENT } from '@/lib/tokens';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/** Default fallback UI — a function component so it can use the i18n hook
 *  (the ErrorBoundary itself is a class component and can't call hooks). */
function DefaultErrorFallback({ error, errorInfo, onReset }: {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}) {
  const t = useTranslations('errors.boundary');
  return (
    <div className="min-h-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: GRADIENT.dangerBg }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={STATUS.danger}
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h2>
        <p className="text-body mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          {t('body')}
        </p>

        {/* Error Details (dev only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {t('details')}
            </summary>
            <pre className="mt-2 p-4 rounded-xl text-caption overflow-auto max-h-40"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: STATUS.danger }}>
              {error.toString()}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button onClick={onReset}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: GRADIENT.action, boxShadow: '0 4px 12px rgba(59,130,246,.25)' }}>
            {t('retry')}
          </button>
          <button onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
            {t('reload')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for async errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) throw error;
  }, [error]);

  return setError;
}