'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import {
  IconTrophy, IconChevronLeft, IconUser, IconStar,
  IconBarChart, IconZap,
} from '@/components/ui/Icons';

const PERIOD_LABELS = {
  weekly: 'Tuần này',
  monthly: 'Tháng này',
  'all-time': 'Mọi thời',
} as const;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <IconTrophy size={14} style={{ color: '#fff' }} />
    </div>
  );
  if (rank === 2) return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #9CA3AF, #6B7280)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <IconStar size={14} style={{ color: '#fff' }} />
    </div>
  );
  if (rank === 3) return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #CD7C2F, #A16207)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <IconStar size={14} style={{ color: '#fff' }} />
    </div>
  );
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'var(--theme-text-muted)' }}>
      {rank}
    </div>
  );
}

function getLevelBadgeColor(level: number) {
  if (level >= 10) return '#A855F7';
  if (level >= 7) return '#3B82F6';
  if (level >= 4) return '#22C55E';
  return '#6B7280';
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const { data, isLoading } = useLeaderboard(period);
  const { user } = useAuthStore();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--theme-text-muted)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <IconChevronLeft size={16} /> Quay lại Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconTrophy size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>Bảng xếp hạng</h1>
              <p style={{ color: 'var(--theme-text-muted)', fontSize: 13, margin: 0 }}>Top người học tích cực nhất</p>
            </div>
          </div>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', background: 'var(--theme-card)', borderRadius: 12, padding: 4 }}>
          {(Object.keys(PERIOD_LABELS) as Array<keyof typeof PERIOD_LABELS>).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
              background: period === p ? 'linear-gradient(135deg, #F59E0B, #EF4444)' : 'transparent',
              color: period === p ? '#fff' : 'var(--theme-text-muted)',
            }}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--theme-text-muted)', paddingTop: 60 }}>Đang tải...</div>
        )}

        {!isLoading && data?.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--theme-text-muted)', paddingTop: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <IconBarChart size={48} style={{ opacity: 0.3 }} />
            </div>
            <div>Chưa có dữ liệu cho kỳ này</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data?.map((entry) => {
            const isMe = user?.id === entry.userId;
            return (
              <div key={entry.rank} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: isMe ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))' : 'var(--theme-card)',
                border: `1px solid ${isMe ? '#F59E0B44' : 'var(--theme-border)'}`,
                borderRadius: 12, padding: '12px 16px',
              }}>
                <RankBadge rank={entry.rank} />

                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: 'var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--theme-text-muted)',
                }}>
                  {entry.avatar
                    ? <img src={entry.avatar} alt={entry.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <IconUser size={20} />
                  }
                </div>

                {/* Name + level */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}{isMe ? ' (Bạn)' : ''}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    <span style={{ background: getLevelBadgeColor(entry.level) + '22', color: getLevelBadgeColor(entry.level), borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>
                      Lv.{entry.level} {entry.levelName}
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <IconZap size={14} style={{ color: '#F59E0B' }} />
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#F59E0B' }}>{entry.xp.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
