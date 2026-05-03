'use client';

import { useState, useMemo } from 'react';
import { TopicCard } from '@/components/topics/TopicCard';
import { useTopics, useUserTopicsProgress, useTopicsStats } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';

// ─── Inline icons ───────────────────────────────────────────────────────────
function IconBook({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconLayers({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconBrain({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}
function IconTarget({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function getLocalProgress(topicId: string, userId: string | undefined, totalWords: number) {
  try {
    const key = userId ? `topic-learned-${userId}-${topicId}` : `topic-learned-${topicId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const ids = JSON.parse(stored);
      const n = Array.isArray(ids) ? ids.length : 0;
      return { wordsLearned: n, percent: totalWords > 0 ? Math.round((n / totalWords) * 100) : 0 };
    }
  } catch { /* ignore */ }
  return { wordsLearned: 0, percent: 0 };
}

const LEVEL_COLORS: Record<string, { color: string; gradient: string; shadow: string }> = {
  A1: { color: ACCENT.reading, gradient: `linear-gradient(135deg, ${ACCENT.reading}, #16A34A)`, shadow: 'rgba(34,197,94,0.3)' },
  A2: { color: ACCENT.srs,     gradient: `linear-gradient(135deg, ${ACCENT.srs}, #2563EB)`,     shadow: 'rgba(59,130,246,0.3)' },
  B1: { color: ACCENT.xp,      gradient: `linear-gradient(135deg, ${ACCENT.xp}, #D97706)`,      shadow: 'rgba(245,158,11,0.3)' },
  B2: { color: STATUS.danger,  gradient: `linear-gradient(135deg, ${STATUS.danger}, #DC2626)`,  shadow: 'rgba(239,68,68,0.3)' },
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TopicsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');

  const { data: topicsData, isLoading } = useTopics({ level: selectedLevel, isActive: true });
  const { data: serverProgressData } = useUserTopicsProgress(isAuthenticated);
  const { data: stats } = useTopicsStats();

  const topicsWithProgress = useMemo(() => {
    if (!topicsData?.data) return undefined;
    const serverMap = new Map((serverProgressData || []).map(p => [p.id, p]));
    return topicsData.data.map(topic => {
      const sp = serverMap.get(topic.id);
      const lp = getLocalProgress(topic.id, user?.id, topic.wordCount);
      const hasServer = sp && sp.wordsLearned > 0;
      return {
        ...topic,
        wordsLearned:   hasServer ? sp.wordsLearned   : lp.wordsLearned,
        wordsTotal:     topic.wordCount,
        masteryPercent: hasServer ? sp.masteryPercent : lp.percent,
        lastStudiedAt:  sp?.lastStudiedAt || null,
        completedAt:    sp?.completedAt   || null,
      };
    });
  }, [topicsData, serverProgressData, user?.id]);

  const totalWords     = topicsWithProgress?.reduce((s, t) => s + t.wordCount, 0) ?? 0;
  const learnedWords   = topicsWithProgress?.reduce((s, t) => s + t.wordsLearned, 0) ?? 0;
  const completedCount = topicsWithProgress?.filter(t => t.masteryPercent >= 100).length ?? 0;

  // Find topic to resume (in-progress, highest mastery)
  const resumeTopic = useMemo(() => {
    if (!topicsWithProgress) return null;
    return topicsWithProgress
      .filter(t => t.masteryPercent > 0 && t.masteryPercent < 100)
      .sort((a, b) => b.masteryPercent - a.masteryPercent)[0] ?? null;
  }, [topicsWithProgress]);

  const statItems = [
    { label: 'Tổng chủ đề',   value: stats?.totalTopics ?? topicsData?.total ?? 0, color: ACCENT.srs,     icon: <IconLayers size={26} /> },
    { label: 'Tổng từ vựng',  value: stats?.totalWords ?? totalWords,              color: ACCENT.reading,  icon: <IconBrain size={26} /> },
    { label: 'Từ đã học',     value: learnedWords,                                 color: STATUS.success,  icon: <IconTarget size={26} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">

      {/* ─── Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 mb-10 border"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
        }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: ACCENT.srs }} />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ background: GRADIENT.action, color: 'white' }}>
              <IconBook size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                Chủ đề từ vựng
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5"
                style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>
                Từ vựng theo chủ đề chuẩn Goethe · {completedCount} hoàn thành
              </p>
            </div>
          </div>

          {resumeTopic && (
            <a href={`/topics/${resumeTopic.slug}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
              style={{ background: GRADIENT.action, boxShadow: '0 10px 25px rgba(59,130,246,0.35)' }}>
              Tiếp tục học
              <IconArrowRight size={16} />
            </a>
          )}
        </div>
      </div>

      {/* ─── Stats (practice style) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {statItems.map((s, i) => (
          <div key={i}
            className="relative overflow-hidden rounded-[2.5rem] p-7 border transition-all duration-300 hover:-translate-y-1.5"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              borderColor: 'var(--theme-border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
            }}>
            <div className="absolute -right-6 -bottom-6 w-28 h-28 blur-3xl opacity-20" style={{ backgroundColor: s.color }} />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="text-[11px] font-black uppercase tracking-widest opacity-40"
                  style={{ color: 'var(--theme-text-primary)' }}>
                  {s.label}
                </div>
              </div>
              <div className="text-4xl font-black tracking-tighter" style={{ color: 'var(--theme-text-primary)' }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Level filter (practice style) ─── */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 mb-10">
        {['A1', 'A2', 'B1', 'B2'].map(level => {
          const lc = LEVEL_COLORS[level]!;
          const isActive = selectedLevel === level;
          return (
            <button key={level} onClick={() => setSelectedLevel(level)}
              className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap"
              style={isActive ? {
                background: lc.gradient,
                color: 'white',
                boxShadow: `0 10px 20px ${lc.shadow}`,
              } : {
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-muted)',
              }}>
              {level}
            </button>
          );
        })}
      </div>

      {/* ─── Topic list ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-[2.5rem] animate-pulse"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ))}
        </div>
      ) : topicsWithProgress && topicsWithProgress.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topicsWithProgress.map(topic => (
            <TopicCard key={topic.id} topic={topic} showProgress />
          ))}
        </div>
      ) : (
        <div className="text-center py-28 rounded-[3.5rem] border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white"
            style={{ background: GRADIENT.action }}>
            <IconBook size={40} />
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Chưa có chủ đề nào
          </h3>
          <p className="text-base mb-10 max-w-xs mx-auto font-medium"
            style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>
            Vui lòng chọn cấp độ khác hoặc liên hệ admin
          </p>
        </div>
      )}
    </div>
  );
}
