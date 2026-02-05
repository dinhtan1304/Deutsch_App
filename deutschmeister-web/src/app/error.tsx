'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <span className="text-4xl">😵</span>
        </div>

        {/* Error Message */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Oops! Có lỗi xảy ra
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Trang này gặp sự cố. Vui lòng thử lại.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="px-6 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}