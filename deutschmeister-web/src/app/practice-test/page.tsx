'use client';

import Link from 'next/link';

// ─── Inline SVG Icons ───
function IconPenLine({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconHeadphones({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
function IconBookOpen({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconClipboard({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    </svg>
  );
}
function IconLock({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconArrowRight({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

const testTypes = [
  {
    title: 'Luyện Viết', titleDe: 'Schreibübung',
    description: 'AI tạo đề bài tiếng Đức, chấm và sửa lỗi chi tiết',
    icon: IconPenLine, href: '/practice-test/writing',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)', available: true,
  },
  {
    title: 'Luyện Nghe', titleDe: 'Hörübung',
    description: 'Nghe audio và trả lời câu hỏi',
    icon: IconHeadphones, href: '/practice-test/listening',
    gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)', available: false,
  },
  {
    title: 'Luyện Đọc', titleDe: 'Leseübung',
    description: 'Đọc hiểu văn bản tiếng Đức',
    icon: IconBookOpen, href: '/practice-test/reading',
    gradient: 'linear-gradient(135deg, #22C55E, #14B8A6)', available: false,
  },
];

export default function PracticeTestPage() {
  return (
      <div className="py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <IconClipboard size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Luyện Test</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              Chọn dạng bài luyện tập phù hợp với trình độ của bạn
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testTypes.map(type => {
            const Ic = type.icon;
            if (type.available) {
              return (
                <Link key={type.href} href={type.href}
                  className="group block rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: type.gradient }}>
                    <Ic size={26} style={{ color: 'white' }} />
                  </div>
                  <h3 className="text-[17px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{type.title}</h3>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{type.titleDe}</p>
                  <p className="text-[13px] mt-3 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{type.description}</p>
                  <div className="flex items-center gap-1 mt-4 text-[13px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#6366F1' }}>
                    Bắt đầu <IconArrowRight size={14} />
                  </div>
                </Link>
              );
            }
            return (
              <div key={type.href} className="rounded-2xl border p-6 opacity-50"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                  <Ic size={26} style={{ color: 'var(--theme-text-muted)' }} />
                </div>
                <h3 className="text-[17px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>{type.title}</h3>
                <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{type.titleDe}</p>
                <p className="text-[13px] mt-3 leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{type.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                  <IconLock size={12} /> Sắp ra mắt
                </span>
              </div>
            );
          })}
        </div>
      </div>
  );
}