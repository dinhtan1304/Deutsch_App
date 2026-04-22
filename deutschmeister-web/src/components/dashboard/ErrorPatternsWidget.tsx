'use client';

import Link from 'next/link';
import { useErrorPatterns } from '@/hooks/useErrorPatterns';

const ERROR_LABELS: Record<string, string> = {
  article: 'Quán từ (der/die/das)',
  conjugation: 'Chia động từ',
  word_order: 'Trật tự từ',
  case: 'Cách (Nom/Akk/Dat)',
  spelling: 'Chính tả',
  preposition: 'Giới từ',
  plural: 'Danh từ số nhiều',
  adjective_ending: 'Đuôi tính từ',
  tense: 'Thì',
  vocabulary: 'Từ vựng',
};

const BAR_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#06B6D4'];

export function ErrorPatternsWidget() {
  const { data, isLoading } = useErrorPatterns();

  return (
    <div className="rounded-card p-5 border shadow-card" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EF4444, #F97316)' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-title font-bold m-0" style={{ color: 'var(--theme-text-primary)' }}>Lỗi thường gặp</h3>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-center py-5" style={{ color: 'var(--theme-text-muted)' }}>Đang tải...</div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-5">
          <div className="w-14 h-14 mx-auto mb-2 rounded-card flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08))' }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
          </div>
          <p className="text-body mb-3" style={{ color: 'var(--theme-text-muted)' }}>
            Hoàn thành bài viết để xem phân tích lỗi
          </p>
          <Link href="/practice-test/writing" className="text-body font-semibold" style={{ color: '#6366F1', textDecoration: 'none' }}>
            Luyện viết ngay →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.slice(0, 5).map((pattern, idx) => {
            const label = ERROR_LABELS[pattern.errorType] || pattern.errorType;
            const color = BAR_COLORS[idx % BAR_COLORS.length];
            return (
              <div key={pattern.errorType}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{pattern.count} lần ({Math.round(pattern.percentage)}%)</span>
                    {pattern.grammarSlug && (
                      <Link href={`/grammar/${pattern.grammarSlug}`} className="text-caption font-semibold" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                        Ôn tập
                      </Link>
                    )}
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pattern.percentage}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
