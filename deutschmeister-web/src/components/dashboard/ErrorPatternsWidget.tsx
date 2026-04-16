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
    <div style={{ background: 'var(--theme-card)', borderRadius: 16, padding: '1.25rem', border: '1px solid var(--theme-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #EF4444, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--theme-text)', margin: 0 }}>Lỗi thường gặp</h3>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--theme-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Đang tải...</div>
      ) : !data || data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 8px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
          </div>
          <p style={{ color: 'var(--theme-text-muted)', fontSize: 13, margin: '0 0 12px' }}>
            Hoàn thành bài viết để xem phân tích lỗi
          </p>
          <Link
            href="/practice-test/writing"
            style={{
              display: 'inline-block',
              fontSize: 13,
              fontWeight: 600,
              color: '#6366F1',
              textDecoration: 'none',
            }}
          >
            Luyện viết ngay →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.slice(0, 5).map((pattern, idx) => {
            const label = ERROR_LABELS[pattern.errorType] || pattern.errorType;
            const color = BAR_COLORS[idx % BAR_COLORS.length];
            return (
              <div key={pattern.errorType}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{pattern.count} lần ({Math.round(pattern.percentage)}%)</span>
                    {pattern.grammarSlug && (
                      <Link
                        href={`/grammar/${pattern.grammarSlug}`}
                        style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', textDecoration: 'none' }}
                      >
                        Ôn tập
                      </Link>
                    )}
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--theme-bg-secondary)', overflow: 'hidden' }}>
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
