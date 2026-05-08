'use client';

import Link from 'next/link';
import { IconArrowRight, IconBookOpen, IconPenLine, IconUserPlus } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';

export function B1FinalCta() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // During hydration, show a neutral state to avoid flash mismatch
  if (!hasHydrated) {
    return <div className="h-32" aria-hidden />;
  }

  return (
    <section className="mb-8">
      <div
        className="rounded-3xl p-8 text-center relative overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{ background: GRADIENT.examWriting }}
        />
        <div className="relative">
          {isAuthenticated ? (
            <>
              <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                Sẵn sàng luyện đề?
              </h3>
              <p className="text-body mb-6" style={{ color: 'var(--theme-text-secondary)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                Chọn loại đề bạn muốn bắt đầu — AI sẽ tạo bài thi đầy đủ Teile theo chuẩn Goethe hoặc TELC, kèm chấm điểm chi tiết.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/practice-test/reading/exam"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-body font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
                  style={{ background: GRADIENT.reading }}
                >
                  <IconBookOpen size={16} />
                  Luyện đề Lesen B1
                  <IconArrowRight size={14} />
                </Link>
                <Link
                  href="/practice-test/writing/exam"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-body font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
                  style={{ background: GRADIENT.examWriting }}
                >
                  <IconPenLine size={16} />
                  Luyện đề Schreiben B1
                  <IconArrowRight size={14} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                Bắt đầu luyện B1 — miễn phí
              </h3>
              <p className="text-body mb-6" style={{ color: 'var(--theme-text-secondary)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                Đăng ký 30 giây để mở khoá đề thi thử Goethe & TELC, AI chấm Schreiben/Sprechen, flashcard và tracking tiến độ.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-body font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
                  style={{ background: GRADIENT.brand }}
                >
                  <IconUserPlus size={16} />
                  Đăng ký miễn phí
                  <IconArrowRight size={14} />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-body font-bold transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-primary)',
                    border: '1px solid var(--theme-border)',
                  }}
                >
                  Đã có tài khoản? Đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
