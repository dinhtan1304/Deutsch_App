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
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-5xl">💥</span>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lỗi nghiêm trọng!
            </h1>
            <p className="text-gray-500 mb-8">
              Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}