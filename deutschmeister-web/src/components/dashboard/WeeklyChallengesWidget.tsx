'use client';

import Link from 'next/link';
import { useWeeklyChallenges } from '@/hooks/useChallenges';
import { IconZap, IconCheck, IconArrowRight } from '@/components/ui/Icons';

export function WeeklyChallengesWidget() {
  const { data, isLoading } = useWeeklyChallenges();
  const completedCount = data?.filter((c) => c.completed).length ?? 0;

  return (
    <div className="rounded-card p-5 border shadow-card" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', height: '100%', boxSizing: 'border-box' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <IconZap size={14} style={{ color: '#fff' }} />
          </div>
          <h3 className="text-title font-bold m-0" style={{ color: 'var(--theme-text-primary)' }}>Thử thách tuần</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{completedCount}/3</span>
          <Link href="/challenges" className="text-body font-semibold flex items-center gap-0.5" style={{ color: '#3B82F6', textDecoration: 'none' }}>
            Chi tiết <IconArrowRight size={13} />
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="text-body text-center py-3" style={{ color: 'var(--theme-text-muted)' }}>Đang tải...</div>
      )}

      <div className="flex flex-col gap-2.5">
        {data?.map((c) => {
          const pct = Math.min((c.current / c.target) * 100, 100);
          return (
            <div key={c.id}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="text-body font-medium flex-1 pr-2" style={{ color: 'var(--theme-text-primary)' }}>
                  {c.titleVi}
                </div>
                {c.completed
                  ? <div className="shrink-0 w-4.5 h-4.5 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: '#22C55E' }}>
                      <IconCheck size={10} style={{ color: '#fff' }} />
                    </div>
                  : <div className="text-caption shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{c.current}/{c.target}</div>
                }
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: c.completed ? '#22C55E' : 'linear-gradient(90deg, #3B82F6, #6366F1)',
                  width: `${pct}%`, transition: 'width 0.5s',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
