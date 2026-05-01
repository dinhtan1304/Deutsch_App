'use client';

import { useAchievements } from '@/hooks/useAchievements';
import { Achievement } from '@/lib/api/achievements';
import Link from 'next/link';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';
import {
  IconTrophy, IconLock, IconChevronLeft, IconCheck,
  IconBook, IconGamepad, IconGraduationCap, IconPenLine, IconStar,
} from '@/components/ui/Icons';

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: 'Từ vựng',
  games: 'Games',
  exams: 'Bài thi',
  writing: 'Bài viết',
  level: 'Cấp độ',
};

const CATEGORY_COLORS: Record<string, string> = {
  vocabulary: ACCENT.reading,
  games: ACCENT.xp,
  exams: ACCENT.srs,
  writing: ACCENT.vocab,
  level: ACCENT.listening,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  vocabulary: GRADIENT.reading,
  games: GRADIENT.xp,
  exams: GRADIENT.action,
  writing: GRADIENT.writing,
  level: GRADIENT.listening,
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vocabulary: <IconBook size={14} />,
  games: <IconGamepad size={14} />,
  exams: <IconGraduationCap size={14} />,
  writing: <IconPenLine size={14} />,
  level: <IconStar size={14} />,
};

function AchievementIcon({ unlocked, color, gradient }: { unlocked: boolean; color: string; gradient: string }) {
  if (!unlocked) return (
    <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center opacity-20 border"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
      <IconLock size={28} />
    </div>
  );

  return (
    <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500"
      style={{ background: gradient, boxShadow: `0 8px 20px -5px ${color}66` }}>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-white relative z-10 drop-shadow-md">
        <IconTrophy size={32} />
      </div>
      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements();

  const grouped = (achievements || []).reduce<Record<string, Achievement[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category]!.push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
              style={{ background: GRADIENT.xp }}>
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <IconTrophy size={28} className="text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-0.5">Thành tích</h1>
              <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                Lưu giữ những cột mốc đáng nhớ
              </p>
            </div>
          </div>

          <Link href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconChevronLeft size={14} /> Quay lại
          </Link>
        </div>

        {isLoading ? (
          <GridSkeleton cols={4} count={8} height="h-48" rounded="rounded-3xl" bordered gap="gap-6" />
        ) : (
          <div className="space-y-16">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-sm border"
                    style={{ borderColor: `${CATEGORY_COLORS[category]}22`, backgroundColor: 'var(--theme-bg-secondary)' }}>
                    <span style={{ color: CATEGORY_COLORS[category] }}>{CATEGORY_ICONS[category]}</span>
                    <h2 className="text-[11px] font-black uppercase tracking-widest" style={{ color: CATEGORY_COLORS[category] }}>
                      {CATEGORY_LABELS[category] ?? category}
                    </h2>
                  </div>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((a) => (
                    <div key={a.key}
                      className={`group relative rounded-[1.5rem] p-5 border transition-all duration-500 hover:-translate-y-1.5 overflow-hidden ${a.unlocked ? 'shadow-lg' : ''}`}
                      style={{
                        backgroundColor: a.unlocked ? 'var(--theme-bg-card)' : 'var(--theme-bg-secondary)',
                        borderColor: a.unlocked ? `${CATEGORY_COLORS[a.category]}33` : 'var(--theme-border)',
                        boxShadow: a.unlocked ? `0 8px 30px -10px ${CATEGORY_COLORS[a.category]}15` : 'none',
                      }}>

                      {a.unlocked && (
                        <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-10 pointer-events-none"
                          style={{ backgroundColor: CATEGORY_COLORS[a.category] }} />
                      )}

                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="mb-4">
                          <AchievementIcon
                            unlocked={a.unlocked}
                            color={CATEGORY_COLORS[a.category] ?? '#6B7280'}
                            gradient={CATEGORY_GRADIENTS[a.category] ?? GRADIENT.xp}
                          />
                        </div>

                        <div className="text-sm font-black mb-1 transition-colors"
                          style={{ color: 'var(--theme-text-primary)', opacity: a.unlocked ? 1 : 0.2 }}>
                          {a.nameVi}
                        </div>
                        <div className="text-[11px] leading-relaxed transition-colors mb-3"
                          style={{ opacity: a.unlocked ? 0.6 : 0.1 }}>
                          {a.descriptionVi}
                        </div>

                        {a.unlocked ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                            style={{ backgroundColor: `${STATUS.success}1A`, color: STATUS.success }}>
                            <IconCheck size={10} /> Đã nhận
                          </div>
                        ) : (
                          <div className="text-[9px] font-black uppercase tracking-widest opacity-20">Chưa đạt</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
