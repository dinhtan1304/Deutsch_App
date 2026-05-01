'use client';

import { useState, useMemo } from 'react';
import { TopicCard } from '@/components/topics/TopicCard';
import { useTopics, useUserTopicsProgress, useTopicsStats } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import {
  IconBook, IconTarget, IconBrain, IconBookOpen,
  IconLayers, IconLightbulb, IconPin, IconGamepad, IconPencil,
} from '@/components/ui/Icons';

// ─── Helper ───
function getLocalProgress(topicId: string, totalWords: number): { wordsLearned: number; percent: number } {
  try {
    const stored = localStorage.getItem(`topic-learned-${topicId}`);
    if (stored) {
      const learnedIds = JSON.parse(stored);
      const wordsLearned = Array.isArray(learnedIds) ? learnedIds.length : 0;
      const percent = totalWords > 0 ? Math.round((wordsLearned / totalWords) * 100) : 0;
      return { wordsLearned, percent };
    }
  } catch { /* corrupted localStorage – ignore */ }
  return { wordsLearned: 0, percent: 0 };
}

// ─── Level colors ───
const LEVEL_COLORS = {
  A1: { color: ACCENT.reading, gradient: `linear-gradient(135deg, ${ACCENT.reading}, #16A34A)` },
  A2: { color: ACCENT.srs,     gradient: `linear-gradient(135deg, ${ACCENT.srs}, #2563EB)` },
  B1: { color: ACCENT.xp,      gradient: `linear-gradient(135deg, ${ACCENT.xp}, #D97706)` },
  B2: { color: STATUS.danger,  gradient: `linear-gradient(135deg, ${STATUS.danger}, #DC2626)` },
};

export default function TopicsPage() {
  const { isAuthenticated } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');

  const { data: topicsData, isLoading: topicsLoading } = useTopics({ level: selectedLevel, isActive: true });
  // Gate on isAuthenticated: avoids a wasted 401 request when not logged in.
  const { data: serverProgressData } = useUserTopicsProgress(isAuthenticated);
  const { data: stats } = useTopicsStats();

  // Replaced useState<Map> + useEffect with useMemo — eliminates the extra re-render
  // that the state update caused every time topicsData changed.
  // Reading localStorage during render is safe in a 'use client' component.
  const localProgressMap = useMemo(() => {
    if (!topicsData?.data) return new Map<string, { wordsLearned: number; percent: number }>();
    const map = new Map<string, { wordsLearned: number; percent: number }>();
    topicsData.data.forEach(topic => {
      map.set(topic.id, getLocalProgress(topic.id, topic.wordCount));
    });
    return map;
  }, [topicsData]);

  // Memoized: recomputes only when data changes, not on every render.
  // Pre-builds a Map from serverProgressData for O(1) per-topic lookup instead
  // of O(M) Array.find per topic (was O(N×M) total on every render).
  const topicsWithProgress = useMemo(() => {
    if (!topicsData?.data) return undefined;
    const serverMap = new Map((serverProgressData || []).map(p => [p.id, p]));
    return topicsData.data.map(topic => {
      const serverProgress = serverMap.get(topic.id);
      const localProgress = localProgressMap.get(topic.id) || { wordsLearned: 0, percent: 0 };
      const hasServerProgress = serverProgress && serverProgress.wordsLearned > 0;
      return {
        ...topic,
        wordsLearned: hasServerProgress ? serverProgress.wordsLearned : localProgress.wordsLearned,
        wordsTotal: topic.wordCount,
        masteryPercent: hasServerProgress ? serverProgress.masteryPercent : localProgress.percent,
        lastStudiedAt: serverProgress?.lastStudiedAt || null,
        completedAt: serverProgress?.completedAt || null,
      };
    });
  }, [topicsData, serverProgressData, localProgressMap]);

  const isLoading = topicsLoading;
  const totalWords = topicsWithProgress?.reduce((sum, t) => sum + t.wordCount, 0) || 0;
  const learnedWords = topicsWithProgress?.reduce((sum, t) => sum + t.wordsLearned, 0) || 0;
  const overallProgress = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;
  const completedTopics = topicsWithProgress?.filter(t => t.masteryPercent >= 100).length || 0;

  const statItems = [
    { label: 'Chủ đề', value: stats?.totalTopics || topicsData?.total || 12,
      icon: IconLayers, color: ACCENT.srs,
      bg: `linear-gradient(135deg, ${ACCENT.srs}1F, ${ACCENT.srs}0F)` },
    { label: 'Tổng từ vựng', value: stats?.totalWords || totalWords,
      icon: IconBookOpen, color: ACCENT.reading,
      bg: `linear-gradient(135deg, ${ACCENT.reading}1F, ${ACCENT.reading}0F)` },
    { label: 'Đã học', value: learnedWords,
      icon: IconBrain, color: ACCENT.vocab,
      bg: `linear-gradient(135deg, ${ACCENT.vocab}1F, ${ACCENT.vocab}0F)` },
    { label: 'Hoàn thành', value: `${completedTopics}/${topicsWithProgress?.length || 12}`,
      icon: IconTarget, color: ACCENT.xp,
      bg: `linear-gradient(135deg, ${ACCENT.xp}1F, ${ACCENT.xp}0F)` },
  ];

  const tips = [
    { icon: IconPin,     text: 'Học theo chủ đề giúp nhớ từ theo ngữ cảnh', color: ACCENT.srs },
    { icon: IconBrain,   text: 'Ôn tập mỗi ngày với SRS để nhớ lâu',        color: ACCENT.vocab },
    { icon: IconGamepad, text: 'Chơi game Der/Die/Das để ghi nhớ giống',     color: ACCENT.reading },
    { icon: IconPencil,  text: 'Thêm từ mới vào Sổ từ vựng cá nhân',        color: ACCENT.xp },
  ];

  return (
      <div className="py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: GRADIENT.action }}>
            <IconBook size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Chủ đề từ vựng
            </h1>
            <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Học từ vựng theo chủ đề chuẩn Goethe
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statItems.map(item => {
            const Ic = item.icon;
            return (
              <div key={item.label}
                className="relative overflow-hidden p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: item.bg }}>
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full"
                  style={{ backgroundColor: item.color, opacity: 0.06 }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}>
                  <Ic size={16} className="text-white" />
                </div>
                <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
              </div>
            );
          })}
        </div>

        {/* Overall progress bar */}
        <div className="p-4 rounded-2xl border mb-6"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              Tiến độ tổng
            </span>
            <span className="text-sm font-bold" style={{ color: ACCENT.srs }}>{overallProgress}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%`, background: `linear-gradient(90deg, ${ACCENT.srs}, ${ACCENT.reading})` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            <span>{learnedWords} từ đã học</span>
            <span>{totalWords} tổng</span>
          </div>
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>Cấp độ:</span>
          {['A1', 'A2', 'B1', 'B2'].map(level => {
            const lc = (LEVEL_COLORS as unknown as Record<string, typeof LEVEL_COLORS.A1>)[level] ?? LEVEL_COLORS.A1;
            const isActive = selectedLevel === level;
            return (
              <button key={level} onClick={() => setSelectedLevel(level)}
                className="px-3.5 py-1.5 rounded-lg text-body font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={isActive
                  ? { background: lc.gradient, color: 'white', boxShadow: `0 4px 12px ${lc.color}30` }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {level}
              </button>
            );
          })}
        </div>

        {/* Topics grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topicsWithProgress?.map(topic => (
              <TopicCard key={topic.id} topic={topic} showProgress={true} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!topicsWithProgress || topicsWithProgress.length === 0) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <IconBook size={28} style={{ color: 'var(--theme-text-muted)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              Chưa có chủ đề nào
            </h3>
            <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Vui lòng chọn cấp độ khác hoặc liên hệ admin
            </p>
          </div>
        )}

        {/* Tips section */}
        <div className="mt-10 p-5 rounded-2xl border"
          style={{ backgroundColor: `${ACCENT.srs}08`, borderColor: `${ACCENT.srs}1A` }}>
          <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT.xp}26, ${ACCENT.xp}14)` }}>
              <IconLightbulb size={15} style={{ color: ACCENT.xp }} />
            </span>
            Mẹo học từ vựng hiệu quả
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {tips.map((tip, i) => {
              const TipIcon = tip.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${tip.color}12` }}>
                    <TipIcon size={13} style={{ color: tip.color }} />
                  </span>
                  <span className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{tip.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}