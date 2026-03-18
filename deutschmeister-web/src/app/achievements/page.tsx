'use client';

import { useAchievements } from '@/hooks/useAchievements';
import Link from 'next/link';
import {
  IconTrophy, IconLock, IconChevronLeft, IconCheck,
  IconBook, IconGamepad, IconGraduationCap, IconPenLine, IconStar, IconZap,
} from '@/components/ui/Icons';

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: 'Từ vựng',
  games: 'Games',
  exams: 'Bài thi',
  writing: 'Bài viết',
  level: 'Cấp độ',
};

const CATEGORY_COLORS: Record<string, string> = {
  vocabulary: '#22C55E',
  games: '#F59E0B',
  exams: '#3B82F6',
  writing: '#6366F1',
  level: '#A855F7',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vocabulary: <IconBook size={14} />,
  games: <IconGamepad size={14} />,
  exams: <IconGraduationCap size={14} />,
  writing: <IconPenLine size={14} />,
  level: <IconStar size={14} />,
};

// Achievement key → icon component mapping
function AchievementIcon({ achievementKey, unlocked }: { achievementKey: string; unlocked: boolean }) {
  if (!unlocked) return <IconLock size={28} style={{ color: 'var(--theme-text-muted)' }} />;

  if (achievementKey.startsWith('words_') || achievementKey === 'first_word') return <IconBook size={28} />;
  if (achievementKey.startsWith('games_') || achievementKey === 'first_game') return <IconGamepad size={28} />;
  if (achievementKey.startsWith('exams_') || achievementKey === 'first_exam') return <IconGraduationCap size={28} />;
  if (achievementKey === 'first_writing') return <IconPenLine size={28} />;
  if (achievementKey === 'level_10') return <IconTrophy size={28} />;
  if (achievementKey.startsWith('level_')) return <IconStar size={28} />;
  if (achievementKey.startsWith('streak_')) return <IconZap size={28} />;
  return <IconTrophy size={28} />;
}

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements();

  const grouped = achievements?.reduce<Record<string, typeof achievements>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  const unlockedCount = achievements?.filter((a) => a.unlocked).length ?? 0;
  const total = achievements?.length ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>Thành tích</h1>
              <p style={{ color: 'var(--theme-text-muted)', fontSize: 13, margin: 0 }}>{unlockedCount}/{total} đã mở khóa</p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div style={{ marginTop: 14, height: 6, borderRadius: 999, background: 'var(--theme-border)', overflow: 'hidden', maxWidth: 400 }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #F59E0B, #EF4444)', width: `${total > 0 ? (unlockedCount / total) * 100 : 0}%`, transition: 'width 0.5s' }} />
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--theme-text-muted)', paddingTop: 60 }}>Đang tải...</div>
        )}

        {grouped && Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
              <span style={{ color: CATEGORY_COLORS[category] }}>{CATEGORY_ICONS[category]}</span>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                {CATEGORY_LABELS[category] ?? category}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {items.map((a) => (
                <div key={a.key} style={{
                  background: a.unlocked ? 'var(--theme-card)' : 'var(--theme-bg)',
                  border: `1px solid ${a.unlocked ? CATEGORY_COLORS[a.category] + '44' : 'var(--theme-border)'}`,
                  borderRadius: 12,
                  padding: '1.25rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'center',
                  opacity: a.unlocked ? 1 : 0.45,
                  transition: 'opacity 0.2s',
                  position: 'relative',
                }}>
                  {a.unlocked && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: CATEGORY_COLORS[a.category], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconCheck size={10} style={{ color: '#fff' }} />
                    </div>
                  )}
                  <div style={{ color: a.unlocked ? CATEGORY_COLORS[a.category] : 'var(--theme-text-muted)' }}>
                    <AchievementIcon achievementKey={a.key} unlocked={a.unlocked} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--theme-text)' }}>{a.nameVi}</div>
                  <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', lineHeight: 1.4 }}>{a.descriptionVi}</div>
                  {a.xpReward > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
                      <IconZap size={11} /> +{a.xpReward} XP
                    </div>
                  )}
                  {a.unlocked && a.unlockedAt && (
                    <div style={{ fontSize: 10, color: 'var(--theme-text-muted)' }}>
                      {new Date(a.unlockedAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
