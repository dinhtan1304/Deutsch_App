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
    <div className="rounded-card p-5 border shadow-card" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
            <IconTrophy size={14} style={{ color: '#fff' }} />
          </div>
          <h3 className="text-title font-bold m-0" style={{ color: 'var(--theme-text-primary)' }}>BXH tuần này</h3>
        </div>
        <Link href="/leaderboard" className="text-body font-semibold flex items-center gap-0.5" style={{ color: '#F59E0B', textDecoration: 'none' }}>
          Xem tất cả <IconArrowRight size={13} />
        </Link>
      </div>

      {isLoading && (
        <div className="text-body text-center py-5" style={{ color: 'var(--theme-text-muted)' }}>Đang tải...</div>
      )}

      {!isLoading && data?.length === 0 && (
        <div className="text-body text-center py-3" style={{ color: 'var(--theme-text-muted)' }}>
          Chưa có dữ liệu tuần này
        </div>
      )}

      <div className="flex flex-col gap-2">
        {data?.slice(0, 3).map((entry) => {
          const isMe = user?.id === entry.userId;
          return (
            <div key={entry.rank} className="flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2"
              style={{ background: isMe ? 'rgba(245,158,11,0.08)' : 'transparent' }}>
              <MiniRank rank={entry.rank} />
              <div className="flex-1 min-w-0 text-body truncate"
                style={{ fontWeight: isMe ? 700 : 500, color: 'var(--theme-text-primary)' }}>
                {entry.name}
              </div>
              <div className="flex items-center gap-1 shrink-0 text-caption font-bold" style={{ color: '#F59E0B' }}>
                <IconZap size={11} /> {entry.xp.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
