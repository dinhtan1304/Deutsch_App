'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  usePronunciationTargets,
  usePronunciationStats,
  usePronunciationHistory,
} from '@/hooks/usePronunciationScoring';
import { useCheckQuota } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { PronunciationLevel } from '@/lib/api/pronunciation';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';

const LEVELS: (PronunciationLevel | 'all')[] = ['all', 'A1', 'A2', 'B1'];

const LEVEL_COLORS: Record<string, string> = {
  A1: STATUS.success,
  A2: ACCENT.srs,
  B1: ACCENT.examWriting,
};

function getScoreColor(score: number) {
  if (score >= 80) return STATUS.success;
  if (score >= 60) return STATUS.warning;
  if (score >= 40) return ACCENT.games;
  return STATUS.danger;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PronunciationPage() {
  const router = useRouter();
  const { data: quota } = useCheckQuota('pronunciation');
  const quotaExhausted = quota && !quota.allowed;
  const [levelFilter, setLevelFilter] = useState<PronunciationLevel | 'all'>('all');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data: targets, isLoading } = usePronunciationTargets(
    levelFilter === 'all' ? undefined : levelFilter,
  );
  const { data: stats } = usePronunciationStats();
  const { data: history } = usePronunciationHistory({ page: 1, limit: 5 });

  const groups = useMemo(() => {
    if (!targets) return [];
    const map = new Map<string, typeof targets>();
    for (const t of targets) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [targets]);

  const handleSelect = (targetId: string) => {
    if (quotaExhausted) {
      setUpgradeOpen(true);
      return;
    }
    router.push(`/practice-test/pronunciation/${targetId}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/practice-test" className="text-xs mb-2 inline-flex items-center gap-1"
            style={{ color: 'var(--theme-text-muted)' }}>
            ← Luyện thi
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"
                style={{ color: 'var(--theme-text-primary)' }}>
                <span>🎙️</span> Luyện Phát Âm
                {quota && (
                  <span className="px-2 py-0.5 rounded-md text-caption font-bold"
                    style={{
                      backgroundColor: quotaExhausted ? `${STATUS.danger}1A` : `${STATUS.success}1A`,
                      color: quotaExhausted ? STATUS.danger : STATUS.success,
                    }}>
                    {quota.used}/{quota.limit} lượt/tuần
                  </span>
                )}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Ghi âm và nhận đánh giá phát âm từng từ bằng AI
              </p>
            </div>
          </div>
        </div>

        {/* Phoneme drills CTA */}
        <Link href="/practice-test/pronunciation/drills"
          className="block mb-6 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{
            borderColor: `${ACCENT.examWriting}40`,
            background: `linear-gradient(135deg, ${ACCENT.listening}0F, ${ACCENT.examWriting}0F)`,
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: GRADIENT.pronunciation }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m8 12 2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Drill âm khó cho người Việt
              </h3>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                ü, ö, ch, r, ß, ei/ie — luyện chuyên sâu từng âm
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" style={{ color: ACCENT.examWriting, flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>

        {/* Stats */}
        {stats && stats.totalAttempts > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border p-3 text-center"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="text-xl font-bold" style={{ color: ACCENT.writing }}>
                {stats.totalAttempts}
              </div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>Lần luyện</div>
            </div>
            <div className="rounded-xl border p-3 text-center"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="text-xl font-bold" style={{ color: getScoreColor(stats.averageScore) }}>
                {stats.averageScore}
              </div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>Điểm TB</div>
            </div>
            <div className="rounded-xl border p-3 text-center"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="text-xl font-bold" style={{ color: ACCENT.examWriting }}>
                {Object.keys(stats.byLevel).length}
              </div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>Level đã luyện</div>
            </div>
          </div>
        )}

        {/* Level filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {LEVELS.map((lv) => {
            const active = levelFilter === lv;
            return (
              <button key={lv} type="button" onClick={() => setLevelFilter(lv)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all"
                style={{
                  background: active ? GRADIENT.pronunciation : 'var(--theme-bg-card)',
                  color: active ? 'white' : 'var(--theme-text-secondary)',
                  border: `1px solid ${active ? 'transparent' : 'var(--theme-border)'}`,
                }}>
                {lv === 'all' ? 'Tất cả' : lv}
              </button>
            );
          })}
        </div>

        {/* Targets grouped by category */}
        {isLoading ? (
          <GridSkeleton cols={1} count={3} height="h-32" rounded="rounded-2xl" gap="gap-4" />
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.category}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"
                  style={{ color: 'var(--theme-text-primary)' }}>
                  {g.category}
                  <span className="text-caption font-normal px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                    {g.items.length}
                  </span>
                </h3>
                <div className="space-y-1.5">
                  {g.items.map((t) => {
                    const lColor = LEVEL_COLORS[t.level] ?? ACCENT.writing;
                    return (
                      <button key={t.id} type="button" onClick={() => handleSelect(t.id)}
                        className="w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: `${lColor}1a`, color: lColor }}>
                          {t.level}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                            {t.text}
                          </div>
                          <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
                            {t.translationVi}
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent history */}
        {history && history.data.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
              Luyện tập gần đây
            </h2>
            <div className="space-y-1.5">
              {history.data.map((h) => (
                <div key={h.id} className="rounded-xl border p-3 flex items-center gap-3"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                  <div className="text-sm font-bold w-10 text-center" style={{ color: getScoreColor(h.overallScore) }}>
                    {h.overallScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                      {h.targetText}
                    </div>
                    <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                      {h.level} • {formatDate(h.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
