'use client';

import Link from 'next/link';
import { useWeeklyChallenges } from '@/hooks/useChallenges';
import { IconZap, IconCheck, IconArrowRight } from '@/components/ui/Icons';

export function WeeklyChallengesWidget() {
  const { data, isLoading } = useWeeklyChallenges();
  const completedCount = data?.filter((c) => c.completed).length ?? 0;

  return (
    <div style={{ background: 'var(--theme-card)', borderRadius: 16, padding: '1.25rem', border: '1px solid var(--theme-border)', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconZap size={14} style={{ color: '#fff' }} />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--theme-text)', margin: 0 }}>Thử thách tuần</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{completedCount}/3</span>
          <Link href="/challenges" style={{ fontSize: 13, color: '#3B82F6', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
            Chi tiết <IconArrowRight size={13} />
          </Link>
        </div>
      </div>

      {isLoading && (
        <div style={{ color: 'var(--theme-text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Đang tải...</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data?.map((c) => {
          const pct = Math.min((c.current / c.target) * 100, 100);
          return (
            <div key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--theme-text)', flex: 1, paddingRight: 8 }}>
                  {c.titleVi}
                </div>
                {c.completed
                  ? <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconCheck size={10} style={{ color: '#fff' }} />
                    </div>
                  : <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', flexShrink: 0 }}>{c.current}/{c.target}</div>
                }
              </div>
              <div style={{ height: 5, borderRadius: 999, background: 'var(--theme-border)', overflow: 'hidden' }}>
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
