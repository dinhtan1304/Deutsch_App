'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useUserStats } from '@/hooks/useUser';

// ─── Inline SVG Icons ───
function IconUser({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconSettings({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconGamepad({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}
function IconBook({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconLogIn({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
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

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: stats, isLoading } = useUserStats();

  if (!isAuthenticated) {
    return (
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <IconUser size={28} style={{ color: 'white' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Đăng nhập để xem hồ sơ</h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>Theo dõi tiến trình và thống kê học tập</p>
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <IconLogIn size={16} /> Đăng nhập
          </Link>
        </div>
    );
  }

  const statCards = [
    { label: 'Trò chơi', value: stats?.gamesPlayed || 0, color: '#3B82F6' },
    { label: 'Chính xác', value: `${stats?.accuracy || 0}%`, color: '#22C55E' },
    { label: 'Yêu thích', value: stats?.favorites || 0, color: '#F59E0B' },
    { label: 'Đã học', value: stats?.wordsLearned || 0, color: '#8B5CF6' },
  ];

  const detailRows = [
    { label: 'Tổng câu trả lời', value: stats?.totalAnswers || 0, color: 'var(--theme-text-primary)' },
    { label: 'Trả lời đúng', value: stats?.correctAnswers || 0, color: '#22C55E' },
    { label: 'Trả lời sai', value: stats?.wrongAnswers || 0, color: '#EF4444' },
  ];

  return (
      <div className="py-6">

        {/* Profile Header */}
        <div className="rounded-2xl border p-6 mb-6 flex items-center gap-5"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shrink-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {user?.name || 'User'}
            </h1>
            <p className="text-[13px] truncate" style={{ color: 'var(--theme-text-muted)' }}>{user?.email}</p>
          </div>
          <Link href="/settings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 shrink-0"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
            <IconSettings size={14} /> Cài đặt
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statCards.map((card, i) => (
            <div key={i} className="rounded-xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="text-[26px] font-extrabold" style={{ color: card.color }}>
                {isLoading ? '—' : card.value}
              </div>
              <div className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Detailed Stats */}
        <div className="rounded-2xl border p-5 mb-6"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>Thống kê chi tiết</h2>
          <div className="space-y-2">
            {detailRows.map((row, i) => (
              <div key={i} className="flex justify-between items-center p-3.5 rounded-xl"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>{row.label}</span>
                <span className="text-[14px] font-bold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/games"
            className="group rounded-xl p-4 flex items-center gap-3 text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 12px rgba(59,130,246,.3)' }}>
            <IconGamepad size={24} style={{ color: 'white' }} />
            <div className="flex-1">
              <div className="text-[14px] font-bold">Chơi game</div>
              <div className="text-[11px] opacity-80">Luyện mạo từ</div>
            </div>
            <IconArrowRight size={16} style={{ color: 'white', opacity: 0.6 }} />
          </Link>
          <Link href="/words"
            className="group rounded-xl p-4 flex items-center gap-3 text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)', boxShadow: '0 4px 12px rgba(34,197,94,.3)' }}>
            <IconBook size={24} style={{ color: 'white' }} />
            <div className="flex-1">
              <div className="text-[14px] font-bold">Từ điển</div>
              <div className="text-[11px] opacity-80">Học từ mới</div>
            </div>
            <IconArrowRight size={16} style={{ color: 'white', opacity: 0.6 }} />
          </Link>
        </div>
      </div>
  );
}