'use client';

import { useWeeklyChallenges, useChallengeHistory } from '@/hooks/useChallenges';
import Link from 'next/link';
import {
  IconZap, IconChevronLeft, IconCheck, IconBook,
  IconGamepad, IconGraduationCap, IconPenLine, IconBookOpen,
} from '@/components/ui/Icons';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  learn_word:      <IconBook size={22} />,
  game_session:    <IconGamepad size={22} />,
  exam_complete:   <IconGraduationCap size={22} />,
  writing_session: <IconPenLine size={22} />,
  grammar_lesson:  <IconBookOpen size={22} />,
};

const EVENT_COLORS: Record<string, string> = {
  learn_word:      '#22C55E',
  game_session:    '#F59E0B',
  exam_complete:   '#3B82F6',
  writing_session: '#6366F1',
  grammar_lesson:  '#8B5CF6',
};

function getEventType(challengeKey: string) {
  if (challengeKey.includes('word'))    return 'learn_word';
  if (challengeKey.includes('game'))    return 'game_session';
  if (challengeKey.includes('exam'))    return 'exam_complete';
  if (challengeKey.includes('writing')) return 'writing_session';
  return 'grammar_lesson';
}

function ChallengeCard({ challenge }: {
  challenge: { challengeKey: string; titleVi: string; target: number; current: number; completed: boolean; xpReward: number }
}) {
  const pct = Math.min((challenge.current / challenge.target) * 100, 100);
  const eventType = getEventType(challenge.challengeKey);
  const color = EVENT_COLORS[eventType];

  return (
    <div style={{
      background: 'var(--theme-card)',
      border: `1px solid ${challenge.completed ? '#22C55E44' : 'var(--theme-border)'}`,
      borderRadius: 16, padding: '1.25rem', position: 'relative', overflow: 'hidden',
    }}>
      {challenge.completed && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: '#22C55E', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconCheck size={11} /> Hoàn thành
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {EVENT_ICONS[eventType]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--theme-text)', marginBottom: 4 }}>
            {challenge.titleVi}
          </div>
          <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{challenge.current}/{challenge.target}</span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#F59E0B', fontWeight: 600 }}>
              <IconZap size={11} /> +{challenge.xpReward} XP
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--theme-border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: challenge.completed ? '#22C55E' : `linear-gradient(90deg, ${color}, ${color}99)`,
              width: `${pct}%`, transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const { data: current, isLoading } = useWeeklyChallenges();
  const { data: history } = useChallengeHistory();

  const completedCount = current?.filter((c) => c.completed).length ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--theme-text-muted)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <IconChevronLeft size={16} /> Quay lại Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconZap size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>Thử thách tuần này</h1>
              <p style={{ color: 'var(--theme-text-muted)', fontSize: 13, margin: 0 }}>{completedCount}/3 thử thách hoàn thành</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--theme-text-muted)', paddingTop: 60 }}>Đang tải...</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
          {current?.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
        </div>

        {history && history.length > 0 && (
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
              Lịch sử
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((c) => {
                const eventType = getEventType(c.challengeKey);
                const color = EVENT_COLORS[eventType];
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--theme-card)', borderRadius: 10, padding: '10px 14px',
                    border: '1px solid var(--theme-border)',
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                      {EVENT_ICONS[eventType]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text)' }}>{c.titleVi}</div>
                      <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>
                        Tuần {new Date(c.weekStart).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {c.completed
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#22C55E', fontWeight: 600 }}><IconCheck size={13} /> Hoàn thành</div>
                        : <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{c.current}/{c.target}</div>
                      }
                      {c.xpRewarded && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#F59E0B', fontWeight: 600, justifyContent: 'flex-end' }}>
                          <IconZap size={10} /> +{c.xpReward} XP
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
