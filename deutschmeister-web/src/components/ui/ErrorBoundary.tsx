'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.1), rgba(239,68,68,.2))' }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#EF4444"
                strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              Oops! Có lỗi xảy ra
            </h2>
            <p className="text-body mb-6" style={{ color: 'var(--theme-text-muted)' }}>
              Đã có lỗi không mong muốn. Vui lòng thử lại hoặc tải lại trang.
            </p>

            {/* Error Details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Chi tiết lỗi (dev mode)
                </summary>
                <pre className="mt-2 p-4 rounded-xl text-caption overflow-auto max-h-40"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: '#EF4444' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 12px rgba(59,130,246,.25)' }}>
                Thử lại
              </button>
              <button onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
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