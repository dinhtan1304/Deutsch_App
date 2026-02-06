'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen flex items-center justify-center p-8"
          style={{ backgroundColor: 'var(--theme-bg-primary, #f8fafc)' }}>
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.1), rgba(239,68,68,.2))' }}>
              <span className="text-5xl">💥</span>
            </div>

            <h1 className="text-2xl font-bold mb-2"
              style={{ color: 'var(--theme-text-primary, #111827)' }}>
              Lỗi nghiêm trọng!
            </h1>
            <p className="mb-8" style={{ color: 'var(--theme-text-muted, #6b7280)', fontSize: '14px' }}>
              Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang.
            </p>

            <div className="flex gap-3 justify-center">
              <button onClick={reset}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 12px rgba(59,130,246,.25)' }}>
                Thử lại
              </button>
              <button onClick={() => window.location.href = '/'}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--theme-bg-secondary, #f3f4f6)', color: 'var(--theme-text-secondary, #374151)', border: '1px solid var(--theme-border, #e5e7eb)' }}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}