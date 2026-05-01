'use client';

import { useRouter } from 'next/navigation';
import { useDeleteDictation } from '@/hooks/useDictation';

interface Props {
  sessionId: string;
}

export function VideoUnavailableFallback({ sessionId }: Props) {
  const router = useRouter();
  const { mutate: deleteSession, isPending } = useDeleteDictation();

  function handleChooseOther() {
    deleteSession(sessionId, {
      onSettled: () => router.replace('/practice-test/dictation/library'),
    });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
          Video không khả dụng
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Video này có thể đã bị xóa hoặc bị chặn tại khu vực của bạn.
        </p>
      </div>
      <button
        type="button"
        onClick={handleChooseOther}
        disabled={isPending}
        className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}
      >
        {isPending ? 'Đang xử lý...' : 'Chọn video khác'}
      </button>
    </div>
  );
}
