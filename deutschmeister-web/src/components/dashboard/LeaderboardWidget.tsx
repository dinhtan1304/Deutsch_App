'use client';

import Link from 'next/link';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthStore } from '@/stores/authStore';
import { IconTrophy, IconStar, IconArrowRight, IconZap } from '@/components/ui/Icons';

function MiniRank({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <IconTrophy size={10} style={{ color: '#fff' }} />
    </div>
  );
  if (rank === 2) return (
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #9CA3AF, #6B7280)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <IconStar size={10} style={{ color: '#fff' }} />
    </div>
  );
  if (rank === 3) return (
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #CD7C2F, #A16207)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <IconStar size={10} style={{ color: '#fff' }} />
    </div>
  );
  return (
    <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)' }}>
      {rank}
    </div>
  );
}

export function LeaderboardWidget() {
  const { data, isLoading } = useLeaderboard('weekly', 3);
  const { user } = useAuthStore();

  return (
    <div style={{ background: 'var(--theme-card)', borderRadius: 16, padding: '1.25rem', border: '1px solid var(--theme-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconTrophy size={14} style={{ color: '#fff' }} />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--theme-text)', margin: 0 }}>BXH tuần này</h3>
        </div>
        <Link href="/leaderboard" style={{ fontSize: 13, color: '#F59E0B', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
          Xem tất cả <IconArrowRight size={13} />
        </Link>
      </div>

      {isLoading && (
        <div style={{ color: 'var(--theme-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Đang tải...</div>
      )}

      {!isLoading && data?.length === 0 && (
        <div style={{ color: 'var(--theme-text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          Chưa có dữ liệu tuần này
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data?.slice(0, 3).map((entry) => {
          const isMe = user?.id === entry.userId;
          return (
            <div key={entry.rank} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: isMe ? 'rgba(245,158,11,0.08)' : 'transparent',
              borderRadius: 8, padding: '5px 8px', margin: '0 -8px',
            }}>
              <MiniRank rank={entry.rank} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: isMe ? 700 : 500, color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, fontSize: 12, color: '#F59E0B', flexShrink: 0 }}>
                <IconZap size={11} /> {entry.xp.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
